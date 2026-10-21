// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Sensei's sparring brain: close distance, telegraph a wind-up, strike, then recover.
// Pure logic — no meshes and no DOM. game.js turns the intent into movement and damage.
import { CONFIG } from './config.js';

export class SenseiAI {
  constructor() { this.reset(); }

  reset() { this.state = 'idle'; this.timer = 0; this.cooldown = 0; }

  get windingUp() { return this.state === 'windup'; }

  // Returns { approach, strike, state }. `random` is injectable so tests are deterministic.
  update(dt, {
    active = false,
    senseiDown = false,
    playerDown = false,
    playerInvulnerable = false,
    crouching = false,
    distance = Infinity,
    random = Math.random
  } = {}) {
    const intent = { approach: false, strike: false, state: 'idle' };
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (!active || senseiDown || playerDown) {
      this.state = 'idle';
      this.timer = 0;
      return intent;
    }

    if (this.state === 'windup') {
      this.timer -= dt;
      if (this.timer <= 0) {
        const inReach = distance <= CONFIG.senseiReach + CONFIG.senseiReachGrace;
        intent.strike = inReach && !playerInvulnerable && !crouching && random() < CONFIG.senseiAccuracy;
        this.state = 'recover';
        this.timer = CONFIG.senseiRecover;
        this.cooldown = CONFIG.senseiCooldown;
      }
    } else if (this.state === 'recover') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'idle';
    } else if (this.cooldown > 0) {
      // Resting: hold the line rather than chase.
      this.state = distance > CONFIG.senseiApproach ? 'approach' : 'idle';
      intent.approach = this.state === 'approach';
    } else if (distance <= CONFIG.senseiReach) {
      this.state = 'windup';
      this.timer = CONFIG.senseiWindup;
    } else {
      this.state = 'approach';
      intent.approach = true;
    }

    intent.state = this.state;
    return intent;
  }
}
