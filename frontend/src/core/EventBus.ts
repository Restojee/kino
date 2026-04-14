export type Listener<T = void> = (data: T) => void;
export type Unsubscribe = () => void;

export class EventBus<T = void> {
  private listeners: Set<Listener<T>> = new Set();

  subscribe(listener: Listener<T>): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(...args: T extends void ? [] : [data: T]): void {
    const data = (args as unknown[])[0] as T;
    this.listeners.forEach((fn) => fn(data));
  }

  clear(): void {
    this.listeners.clear();
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}
