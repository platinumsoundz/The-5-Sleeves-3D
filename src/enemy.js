// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (raider vision, alert states and defence)
// Generic wilderness enemy brain. It starts calm, becomes suspicious, then spots the player and
// closes distance. Once engaged it uses the same actions the player has: strike, block, parry and
// dodge. Its numbers stay below the player's so a one-on-one fight is never a stat check.
import { CONFIG } from './config.js';

export const ALERT = Object.freeze({
  CALM: 'calm',
  SUSPICIOUS: 'suspicious',
  SPOTTED: 'spotted'
});

export function inVisionCone(enemy, facing, player, {
  range = 22,
  halfAngle = Math.PI * .43
} = {}) {
  const dx = player.x - enemy.x;
  const dz = player.z - enemy.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= 2.4) return true;
  if (distance > range) return false;
  const forward = Math.sin(facing) * dx + Math.cos(facing) * dz;
  return forward > 0 && forward / distance >= Math.cos(halfAngle);
}

export class RaiderAI {
  constructor({
    reach = 1.85,
    windup = .48,
    recover = .55,
    cooldown = 1.05,
    accuracy = .74,
    visionRange = 22
  } = {}) {
    Object.assign(this, { reach, windup, recover, cooldown, accuracy, visionRange });
    this.reset();
  }

  reset() {
    this.alert = ALERT.CALM;
    this.suspicion = 0;
    this.searchTimer = 0;
    this.state = 'idle';
    this.timer = 0;
    this.attackCooldown = 0;
    this.punish = 0;
    this.parryCooldown = 0;
    this.dodgeCooldown = 0;
    this.guardCooldown = 0;
    this.guardTimer = 0;
    this.guarding = false;
  }

  get windingUp() { return this.state === 'windup'; }
  get staggered() { return this.state === 'stagger'; }
  get marker() {
    return this.alert === ALERT.SPOTTED ? '!'
      : this.alert === ALERT.SUSPICIOUS ? '?' : '';
  }

  sees(playerVisible, playerInCone) {
    return playerVisible && (playerInCone || false);
  }

  stagger(seconds = CONFIG.parryStagger) {
    this.state = 'stagger';
    this.timer = seconds;
    this.attackCooldown = 0;
    this.punish = 0;
    this.guarding = false;
    this.guardTimer = 0;
    this.alert = ALERT.SPOTTED;
    this.searchTimer = 4;
  }

  noticeWhiff(distance, playerInvulnerable = false) {
    if (playerInvulnerable || this.state === 'stagger' || this.state === 'windup') return;
    if (distance > this.reach + 1.2) return;
    if (this.alert !== ALERT.SPOTTED) return;
    this.punish = .75;
    this.attackCooldown = 0;
  }

  // Called immediately before a player strike lands. Returns the defensive reaction so the game
  // can apply damage, guard pressure or a short player stagger without this module touching state.
  reactToAttack(distance, { random = Math.random } = {}) {
    if (this.state === 'stagger' || this.state === 'windup') return 'none';
    if (distance > this.reach + 1.1) return 'none';
    if (this.alert !== ALERT.SPOTTED) return 'none';
    const roll = random();
    if (this.parryCooldown <= 0 && roll < .12) {
      this.parryCooldown = 2.6;
      return 'parry';
    }
    if (this.dodgeCooldown <= 0 && roll < .38) {
      this.dodgeCooldown = 2.2;
      return 'dodge';
    }
    if (this.guardCooldown <= 0 && roll < .78) {
      this.guardCooldown = .7;
      this.guarding = true;
      this.guardTimer = .28;
      return 'block';
    }
    return 'none';
  }

  update(dt, {
    distance = Infinity,
    playerDown = false,
    selfDown = false,
    playerVisible = false,
    playerInCone = false,
    random = Math.random
  } = {}) {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.parryCooldown = Math.max(0, this.parryCooldown - dt);
    this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.guardCooldown = Math.max(0, this.guardCooldown - dt);
    this.guardTimer = Math.max(0, this.guardTimer - dt);
    if (this.guardTimer === 0) this.guarding = false;

    const intent = {
      approach: false, strike: false, alert: this.alert, marker: this.marker,
      suspicion: this.suspicion, state: this.state, guarded: this.guarding
    };

    if (selfDown || playerDown) {
      this.state = 'idle';
      this.punish = 0;
      this.guarding = false;
      intent.state = this.state;
      return intent;
    }

    if (this.state === 'stagger') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'idle';
      intent.state = this.state;
      return intent;
    }

    const canSee = playerVisible && (playerInCone || distance <= 2.4);
    if (canSee) {
      this.suspicion = Math.min(1, this.suspicion + dt * 1.65);
      this.searchTimer = 0;
    } else if (this.searchTimer > 0) {
      this.searchTimer = Math.max(0, this.searchTimer - dt);
      this.suspicion = Math.max(.45, this.suspicion - dt * .12);
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * .42);
    }

    if (this.suspicion >= 1) {
      this.alert = ALERT.SPOTTED;
      this.searchTimer = 5;
    } else if (this.suspicion > .12) {
      this.alert = ALERT.SUSPICIOUS;
    } else {
      this.alert = ALERT.CALM;
    }

    if (this.alert !== ALERT.SPOTTED) {
      if (this.state === 'windup' || this.state === 'recover') {
        this.state = 'idle';
      }
      intent.alert = this.alert;
      intent.marker = this.marker;
      intent.suspicion = this.suspicion;
      intent.state = this.state;
      return intent;
    }

    if (this.punish > 0) {
      this.punish = Math.max(0, this.punish - dt);
      if (distance <= this.reach) {
        this.punish = 0;
        this.state = 'windup';
        this.timer = Math.min(.3, this.windup);
        intent.strike = false;
      } else {
        this.state = 'approach';
        intent.approach = true;
      }
      intent.state = this.state;
      intent.alert = this.alert;
      intent.marker = this.marker;
      return intent;
    }

    if (this.state === 'windup') {
      this.timer -= dt;
      if (this.timer <= 0) {
        intent.strike = distance <= this.reach + .35 && random() < this.accuracy;
        this.state = 'recover';
        this.timer = this.recover;
        this.attackCooldown = this.cooldown;
      }
    } else if (this.state === 'recover') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'idle';
    } else if (this.attackCooldown > 0) {
      this.state = distance > this.reach ? 'approach' : 'idle';
      intent.approach = this.state === 'approach';
    } else if (distance <= this.reach) {
      this.state = 'windup';
      this.timer = this.windup;
    } else {
      this.state = 'approach';
      intent.approach = true;
    }

    intent.state = this.state;
    intent.alert = this.alert;
    intent.marker = this.marker;
    intent.suspicion = this.suspicion;
    intent.guarded = this.guarding;
    return intent;
  }
}
