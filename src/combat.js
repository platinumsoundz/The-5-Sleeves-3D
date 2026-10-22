// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// Per-fighter timing: per-weapon cooldown, swing/attack animation phase and the dodge window.
// Movement and hit resolution stay in game.js; this only answers "may I act yet?".
import { CONFIG } from './config.js';

export class CombatState {
  constructor() { this.reset(); }

  reset() {
    this.attackTimer = 0;
    this.attackAnim = 0;
    this.dodgeTimer = 0;
    this.dodgeDir = { x: 0, z: 1 };
    this.parryTimer = 0;
    this.parryLock = 0;
    this.blockedHits = 0;
    this.blockedTimer = 0;
    this.guardStun = 0;
    this.attackDuration = CONFIG.attackAnimTime;
  }

  tick(dt) {
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.attackAnim = Math.max(0, this.attackAnim - dt);
    this.dodgeTimer = Math.max(0, this.dodgeTimer - dt);
    this.parryTimer = Math.max(0, this.parryTimer - dt);
    this.parryLock = Math.max(0, this.parryLock - dt);
    this.guardStun = Math.max(0, this.guardStun - dt);
    if (this.blockedTimer > 0) {
      this.blockedTimer = Math.max(0, this.blockedTimer - dt);
      if (this.blockedTimer === 0) this.blockedHits = 0;
    }
  }

  get canAttack() { return this.attackTimer <= 0; }
  get invulnerable() { return this.dodgeTimer > 0; }
  get parryReady() { return this.parryTimer > 0 && this.dodgeTimer <= 0; }
  get guardBroken() { return this.guardStun > 0; }

  // Returns false while the parry is locked, so mashing guard cannot keep it armed.
  beginGuard() {
    if (this.parryLock > 0) return false;
    this.parryTimer = CONFIG.parryWindow;
    this.parryLock = CONFIG.parryWindow + CONFIG.parryRecover;
    return true;
  }
  consumeParry() { this.parryTimer = 0; }
  clearBlockPressure() { this.blockedHits = 0; this.blockedTimer = 0; }

  // Returns true when this block breaks the guard. Repeated blocks inside the window stack.
  registerBlock() {
    this.blockedHits += 1;
    this.blockedTimer = CONFIG.guardBreakWindow;
    if (this.blockedHits < CONFIG.guardBreakHits) return false;
    this.blockedHits = 0;
    this.blockedTimer = 0;
    this.guardStun = CONFIG.guardBreakStun;
    return true;
  }

  beginAttack({ cooldown = CONFIG.attackCooldown, duration = CONFIG.attackAnimTime } = {}) {
    this.attackTimer = cooldown;
    this.attackAnim = duration;
    this.attackDuration = duration;
  }

  beginDodge(dx, dz, facing) {
    this.dodgeTimer = CONFIG.dodgeTime;
    const hasInput = dx !== 0 || dz !== 0;
    const x = hasInput ? dx : Math.sin(facing);
    const z = hasInput ? dz : Math.cos(facing);
    const length = Math.hypot(x, z) || 1;
    this.dodgeDir = { x: x / length, z: z / length };
  }

  // 0 → 1 through the current strike; world.js uses it to pose the active weapon or limb.
  get attackProgress() {
    if (this.attackAnim <= 0 || this.attackDuration <= 0) return 0;
    return Math.max(0, Math.min(1, 1 - this.attackAnim / this.attackDuration));
  }

  // 0 → 1 → 0 arc used to swing the staff/katana mesh.
  get swingAngle() {
    if (this.attackAnim <= 0) return 0;
    return Math.sin((this.attackAnim / (this.attackDuration || CONFIG.attackAnimTime)) * Math.PI) * 1.4;
  }
}
