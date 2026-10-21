// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Sensei's sparring brain: close distance, telegraph a wind-up, strike, then recover.
// A parry staggers him; a missed player swing invites a faster punish. Pure logic — no meshes,
// no DOM. game.js turns the intent into movement and damage.
import { CONFIG } from './config.js';

export class SenseiAI {
  constructor() { this.reset(); }

  reset() {
    this.state = 'idle';
    this.timer = 0;
    this.cooldown = 0;
    this.punish = 0;
    this.punishing = false;
  }

  get windingUp() { return this.state === 'windup'; }
  get staggered() { return this.state === 'stagger'; }

  // A blocked or parried blow interrupts whatever Sensei was doing.
  stagger(seconds = CONFIG.parryStagger) {
    this.state = 'stagger';
    this.timer = seconds;
    this.cooldown = 0;
    this.punish = 0;
    this.punishing = false;
  }

  // Called when the player's staff swing misses. Within reach of a step he punishes with a
  // shortened telegraph; farther away he stays honest and ignores it.
  noticeWhiff(distance, playerInvulnerable = false) {
    if (playerInvulnerable) return;
    if (this.state === 'stagger' || this.state === 'windup' || this.state === 'recover') return;
    if (distance > CONFIG.senseiReach + CONFIG.whiffPunishReach) return;
    this.punish = CONFIG.whiffPunishTime;
    this.punishing = true;
    this.cooldown = 0;
  }

  // Returns { approach, strike, state }. `random` is injectable so tests are deterministic.
  update(dt, {
    active = false,
    senseiDown = false,
    playerDown = false,
    playerInvulnerable = false,
    distance = Infinity,
    random = Math.random
  } = {}) {
    const intent = { approach: false, strike: false, state: 'idle' };
    this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.state === 'stagger') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'idle';
      intent.state = this.state;
      return intent;
    }

    if (!active || senseiDown || playerDown) {
      this.state = 'idle';
      this.timer = 0;
      this.punish = 0;
      this.punishing = false;
      return intent;
    }

    if (this.punish > 0) {
      this.punish = Math.max(0, this.punish - dt);
      if (distance <= CONFIG.senseiReach) {
        this.punish = 0;
        this.state = 'windup';
        this.timer = CONFIG.senseiPunishWindup;
      } else {
        this.state = 'approach';
        intent.approach = true;
      }
      intent.state = this.state;
      return intent;
    }

    if (this.state === 'windup') {
      this.timer -= dt;
      if (this.timer <= 0) {
        const inReach = distance <= CONFIG.senseiReach + CONFIG.senseiReachGrace;
        intent.strike = inReach && !playerInvulnerable && random() < CONFIG.senseiAccuracy;
        this.state = 'recover';
        this.timer = CONFIG.senseiRecover;
        this.cooldown = CONFIG.senseiCooldown;
        this.punishing = false;
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
