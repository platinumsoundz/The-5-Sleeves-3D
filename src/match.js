// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Nonlethal spar scoring. A knockdown is a point; first to CONFIG.pointsToWin takes the spar.
// No deaths exist in this prototype, so the result is always "spar complete", never a kill.
import { CONFIG } from './config.js';

export class Match {
  constructor() { this.reset(); }

  reset() {
    this.player = 0;
    this.sensei = 0;
    this.over = false;
    this.winner = null;
  }

  get needed() { return CONFIG.pointsToWin; }

  get score() { return `you ${this.player} — ${this.sensei} Sensei`; }

  // scorer: 'player' when Sensei goes down, 'sensei' when the player goes down.
  award(scorer) {
    if (this.over) return true;
    if (scorer === 'player') this.player += 1;
    else this.sensei += 1;
    if (this.player >= this.needed || this.sensei >= this.needed) {
      this.over = true;
      this.winner = this.player > this.sensei ? 'player' : 'sensei';
    }
    return this.over;
  }
}
