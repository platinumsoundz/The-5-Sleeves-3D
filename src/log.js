// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Bounded event feed behind the HUD "chat": spar events, pickups, XP/cash grants.
export class EventFeed {
  constructor(limit = 6) {
    this.limit = limit;
    this.items = [];
  }

  push(text, kind = 'info') {
    this.items.push({ text: String(text), kind });
    while (this.items.length > this.limit) this.items.shift();
  }

  clear() {
    this.items.length = 0;
  }
}
