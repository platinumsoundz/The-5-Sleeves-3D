// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Minimal synchronous pub/sub. Gameplay emits; HUD, audio or telemetry can subscribe later.
// Deliberately dependency-free so it runs in the browser and under `node --test`.
export class Events {
  constructor() { this.handlers = new Map(); }

  on(type, handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(handler);
    return () => this.off(type, handler);
  }

  off(type, handler) { this.handlers.get(type)?.delete(handler); }

  emit(type, payload) {
    for (const handler of this.handlers.get(type) ?? []) handler(payload);
  }
}
