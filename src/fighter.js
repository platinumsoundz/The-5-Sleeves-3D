// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// One fighter's nonlethal damage model. Hits knock a fighter down instead of killing them;
// recovery never removes anyone from the match. Player and Sensei share it so the rules
// cannot drift apart. No meshes, no DOM: safe to unit test.
import { CONFIG } from './config.js';

export const IGNORED = 'ignored';
export const HIT = 'hit';
export const KNOCKDOWN = 'knockdown';
export const RECOVERED = 'recovered';

export class FighterState {
  constructor({ needsConfirm = false, maxHp = 100 } = {}) {
    this.maxHp = maxHp;
    this.needsConfirm = needsConfirm;
    this.reset();
  }

  reset() { this.hp = this.maxHp; this.down = 0; }

  get isDown() { return this.down !== 0; }
  get awaitingConfirm() { return this.down === -1; }

  hit(amount) {
    if (this.isDown) return IGNORED;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp > 0) return HIT;
    this.down = CONFIG.knockdown;
    return KNOCKDOWN;
  }

  // Counts down a knockdown. Sensei recovers on his own; a player waits at -1 for confirm.
  tick(dt) {
    if (this.down <= 0) return null;
    this.down -= dt;
    if (this.down > 0) return null;
    if (this.needsConfirm) { this.down = -1; return null; }
    this.recover();
    return RECOVERED;
  }

  confirm() {
    if (!this.awaitingConfirm) return false;
    this.recover();
    return true;
  }

  recover() { this.hp = this.maxHp; this.down = 0; }
}
