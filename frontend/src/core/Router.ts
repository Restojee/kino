import { Component } from "./Component";
import { EventBus } from "./EventBus";
import { $clear } from "./h";

const RE_ESCAPE = /[.*+?^${}()|[\]\\]/g;

export type RouteParams = Record<string, string>;
export type RouteFactory = (params: RouteParams) => Component;

interface Route {
  path: string;
  pattern: RegExp;
  keys: string[];
  factory: RouteFactory;
}

interface RouterState {
  path: string;
  params: RouteParams;
}

class RouterClass {
  readonly bus = new EventBus<RouterState>();

  private routes: Route[] = [];
  private outlet?: HTMLElement;
  private current?: Component;
  private _started = false;

  use(path: string, factory: RouteFactory): this {
    const { pattern, keys } = this.compile(path);
    this.routes.push({ path, pattern, keys, factory });
    return this;
  }

  start(outlet: HTMLElement): this {
    if (this._started) return this;
    this._started = true;
    this.outlet = outlet;
    window.addEventListener("hashchange", () => this.resolve());
    this.resolve();
    return this;
  }

  navigate(path: string): void {
    const next = path.startsWith("#") ? path : `#${path}`;
    if (window.location.hash === next) {
      this.resolve();
    } else {
      window.location.hash = next;
    }
  }

  getPath(): string {
    return window.location.hash.slice(1) || "/";
  }

  subscribe(handler: (state: RouterState) => void): () => void {
    return this.bus.subscribe(handler);
  }

  private resolve(): void {
    if (!this.outlet) return;
    const path = this.getPath();

    for (const route of this.routes) {
      const match = route.pattern.exec(path);
      if (match) {
        const params: RouteParams = {};
        route.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(match[i + 1] ?? "");
        });
        this.render(route.factory(params));
        this.bus.emit({ path, params });
        return;
      }
    }

    if (this.routes.length > 0) {
      this.render(this.routes[0].factory({}));
      this.bus.emit({ path, params: {} });
    }
  }

  private render(component: Component): void {
    if (!this.outlet) return;
    this.current?.destroy();
    $clear(this.outlet);
    component.mount(this.outlet);
    this.current = component;
    window.scrollTo({ top: 0 });
  }

  private compile(path: string): { pattern: RegExp; keys: string[] } {
    const keys: string[] = [];
    const parts = path.split("/").map((part) => {
      if (part.startsWith(":")) {
        keys.push(part.slice(1));
        return "([^/]+)";
      }
      return part.replace(RE_ESCAPE, "\\$&");
    });
    const pattern = new RegExp(`^${parts.join("/")}$`);
    return { pattern, keys };
  }
}

export const Router = new RouterClass();
