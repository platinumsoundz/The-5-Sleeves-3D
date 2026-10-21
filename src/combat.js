// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Per-fighter timing: staff cooldown, swing animation phase and the dodge window.
// Movement and hit resolution stay in game.js; this only answers "may I act yet?".
import { CONFIG } from './config.js';

export class CombatState {
  constructor() { this.reset(); }

  reset() {
    this.attackTimer = 0;
    this.attackAnim = 0;
    this.dodgeTimer = 0;
    this.dodgeDir = { x: 0, z: 1 };
  }

  tick(dt) {
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt);
    this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
  }

  get canAttack() { return this.attackTimer <= 0; }
  get invulnerable() { return this.dodgeTimer > 0; }

  beginAttack() {
    this.attackTimer = CONFIG.attackCooldown;
    this.attackAnim = CONFIG.attackAnimTime;
  }

  beginDodge(dx, dz, facing) {
    this.dodgeTimer = CONFIG.dodgeTime;
    const hasInput = dx !== 0 || dz !== 0;
    const x = hasInput ? dx : Math.sin(facing);
    const z = hasInput ? dz : Math.cos(facing);
    const length = Math.hypot(x, z) || 1;
    this.dodgeDir = { x: x / length, z: z / length };
  }

  // 0 → 1 → 0 arc used to swing the staff mesh.
  get swingAngle() {
    if (this.attackAnim <= 0) return 0;
    return Math.sin((this.attackAnim / CONFIG.attackAnimTime) * Math.PI) * 1.4;
  }
}
