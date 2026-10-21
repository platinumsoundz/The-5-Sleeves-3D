// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// A clamped regenerating resource (stamina, sleeve charge). Pure and frame-rate independent.
export class Resource {
  constructor(max, { regen = 0, delay = 0 } = {}) {
    this.max = max;
    this.regen = regen;
    this.delay = delay;
    this.value = max;
    this.hold = 0;
  }

  reset(value = this.max) {
    this.value = Math.max(0, Math.min(this.max, value));
    this.hold = 0;
  }

  spend(amount) {
    if (amount > this.value) return false;
    this.value -= amount;
    this.hold = this.delay;
    return true;
  }

  drain(rate, dt) {
    if (this.value <= 0) return;
    this.value = Math.max(0, this.value - rate * dt);
    this.hold = this.delay;
  }

  update(dt) {
    if (this.hold > 0) {
      this.hold = Math.max(0, this.hold - dt);
      return;
    }
    this.value = Math.min(this.max, this.value + this.regen * dt);
  }

  get ratio() {
    return this.max > 0 ? this.value / this.max : 0;
  }
}
