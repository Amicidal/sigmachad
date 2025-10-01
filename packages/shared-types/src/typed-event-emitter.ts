// Minimal typed EventEmitter interface overlay to enforce event payloads at compile time
// Works by having classes `implements TypedEventEmitter<Events>` in addition to extending Node's EventEmitter
// Consumers get proper typings for `on`, `once`, `off`, and `emit` without changing runtime behavior.
export interface TypedEventEmitter<Events extends Record<string, any>> {
  on<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this;
  once<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this;
  off<K extends keyof Events>(event: K, listener: (...args: Events[K]) => void): this;
  emit<K extends keyof Events>(event: K, ...args: Events[K]): boolean;
}

