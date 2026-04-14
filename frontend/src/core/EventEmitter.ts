export class EventEmitter {
  private _handlers = new Map<string, Set<EventListener>>();

  readonly node: EventTarget;

  constructor(target?: EventTarget) {
    this.node = target ?? document.createElement("div");
  }

  add(event: string, handler: EventListener): () => void {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, new Set());
    }
    this._handlers.get(event)!.add(handler);
    this.node.addEventListener(event, handler);
    return () => this.remove(event, handler);
  }

  remove(event: string, handler: EventListener): void {
    this._handlers.get(event)?.delete(handler);
    this.node.removeEventListener(event, handler);
  }

  emit(event: string, detail?: unknown): boolean {
    return this.node.dispatchEvent(
      new CustomEvent(event, { detail, bubbles: true, composed: true }),
    );
  }

  clear(): void {
    this._handlers.forEach((handlers, event) => {
      handlers.forEach((h) => this.node.removeEventListener(event, h));
    });
    this._handlers.clear();
  }
}
