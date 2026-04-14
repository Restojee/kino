import { Unsubscribe } from "./EventBus";
import { EventEmitter } from "./EventEmitter";
import { Service } from "./Service";

export type Renderable = HTMLElement | Component;

export interface ComponentProps {
  children?: Record<string, Renderable>;
  events?: Record<string, EventListener>;
  [key: string]: unknown;
}

export function resolveNode(renderable: Renderable): HTMLElement {
  if (renderable instanceof Component) {
    return renderable._resolve();
  }
  return renderable;
}

export abstract class Component<P extends ComponentProps = ComponentProps> {
  declare protected el: HTMLElement;
  protected props: P;
  protected state: Record<string, unknown> = {};

  readonly emitter: EventEmitter;

  private _effects: Unsubscribe[] = [];
  private _eventCleanups: Unsubscribe[] = [];

  private _built = false;
  private _mounted = false;
  private _updatePending = false;

  constructor(props?: Partial<P>) {
    this.emitter = new EventEmitter();
    this.props = this._createProxy((props ?? {}) as P);
  }

  private _createProxy<T extends object>(target: T): T {
    return new Proxy(target, {
      set: (obj, prop, value) => {
        if ((obj as Record<string | symbol, unknown>)[prop] === value)
          return true;
        (obj as Record<string | symbol, unknown>)[prop] = value;
        this._scheduleUpdate();
        return true;
      },
    });
  }

  private _scheduleUpdate(): void {
    if (this._updatePending || !this._built) return;
    this._updatePending = true;
    queueMicrotask(() => {
      if (!this._updatePending) return;
      this._updatePending = false;
      this.onUpdated();
    });
  }

  protected abstract template(): Renderable;

  protected onCreated(): void {}
  protected onMounted(): void {}
  protected onUpdated(): void {}
  protected onDestroyed(): void {}

  protected addEffect(source: Service): Unsubscribe;
  protected addEffect(source: Service, handler: () => void): Unsubscribe;
  protected addEffect(
    source: EventEmitter,
    event: string,
    handler: EventListener,
  ): Unsubscribe;
  protected addEffect(unsub: Unsubscribe): Unsubscribe;
  protected addEffect(
    a: Service | EventEmitter | Unsubscribe,
    b?: (() => void) | string,
    c?: EventListener,
  ): Unsubscribe {
    let unsub: Unsubscribe;
    if (typeof a === "function") {
      unsub = a;
    } else if (a instanceof Service) {
      unsub = b
        ? a.subscribe(b as () => void)
        : a.subscribe(() => this._scheduleUpdate());
    } else {
      unsub = (a as EventEmitter).add(b as string, c as EventListener);
    }
    this._effects.push(unsub);
    return unsub;
  }

  mount(parent: HTMLElement): this {
    if (!this._built) this._buildOnce();
    parent.appendChild(this.el);
    this._notifyMounted();
    return this;
  }

  destroy(): void {
    this._updatePending = false;
    this.el?.remove();
    this._effects.forEach((fn) => fn());
    this._effects = [];
    this.emitter.clear();
    this.onDestroyed();
  }

  protected emit(eventName: string, detail?: unknown): void {
    this.el?.dispatchEvent(
      new CustomEvent(eventName, { detail, bubbles: true }),
    );
  }

  setVisible(visible: boolean): void {
    this.el.style.display = visible ? "" : "none";
  }

  setClassName(className: string): void {
    this.el.className = className;
  }

  toggleClass(cls: string, force?: boolean): void {
    this.el.classList.toggle(cls, force);
  }

  _resolve(): HTMLElement {
    if (!this._built) this._buildOnce();
    return this.el;
  }

  private _notifyMounted(): void {
    if (this._mounted) return;
    this._mounted = true;
    this.onMounted();
  }

  private _buildOnce(): void {
    if (this._built) return;
    this._built = true;
    this.state = this._createProxy(this.state);
    this._build();
    this.onCreated();
    this.onUpdated();
    this._watchConnected();
  }

  private _watchConnected(): void {
    if (this.el.isConnected) {
      this._notifyMounted();
      return;
    }
    const observer = new MutationObserver(() => {
      if (!this.el.isConnected) return;
      observer.disconnect();
      this._notifyMounted();
    });
    observer.observe(document, { childList: true, subtree: true });
  }

  private _build(): void {
    this._unbindEvents();
    const rendered = this.template();
    this.el = rendered instanceof Component ? rendered._resolve() : rendered;
    this._bindEvents();
  }

  private _bindEvents(): void {
    const { events } = this.props;
    if (!events) return;
    this._eventCleanups = Object.entries(events).map(([name, handler]) => {
      this.el.addEventListener(name, handler);
      return () => this.el.removeEventListener(name, handler);
    });
  }

  private _unbindEvents(): void {
    this._eventCleanups.forEach((fn) => fn());
    this._eventCleanups = [];
  }
}
