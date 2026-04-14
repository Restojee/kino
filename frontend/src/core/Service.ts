import { EventBus, Unsubscribe } from "./EventBus";

export abstract class Service {
  private readonly bus = new EventBus<void>();

  subscribe(listener: () => void): Unsubscribe {
    return this.bus.subscribe(listener);
  }

  protected emit(): void {
    this.bus.emit();
  }
}
