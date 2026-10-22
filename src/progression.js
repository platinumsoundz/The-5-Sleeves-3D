// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (levels, XP, cash and derived stats)
// Pure progression model. Combat, inventory and skill bonuses are merged by the game; this
// module owns only the level curve, XP/cash ledger and the base stat growth per level.
export const MAX_LEVEL = 20;

export function xpForNext(level = 1) {
  const safe = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  return Math.round(80 * Math.pow(1.22, safe - 1));
}

export function statsForLevel(level = 1) {
  const safe = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  return {
    maxHp: 100 + (safe - 1) * 8,
    maxStamina: 100 + (safe - 1) * 4,
    attack: (safe - 1) * 1.5,
    defense: (safe - 1) * 1.25,
    speed: 0
  };
}

const whole = value => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
};

export function mergeStats(...sources) {
  const total = { maxHp: 0, maxStamina: 0, attack: 0, defense: 0, speed: 0 };
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(total)) {
      const value = Number(source[key]);
      if (Number.isFinite(value)) total[key] += value;
    }
  }
  return total;
}

export function mitigatedDamage(damage, defense = 0) {
  const value = Number(damage) || 0;
  const armour = Math.max(0, Number(defense) || 0);
  return value * (100 / (100 + armour));
}

export class Progression {
  constructor(snapshot = {}) {
    this.reset();
    this.restore(snapshot);
  }

  reset() {
    this.level = 1;
    this.xp = 0;
    this.cash = 0;
    return this;
  }

  get xpToNext() {
    return this.level >= MAX_LEVEL ? 0 : xpForNext(this.level);
  }

  get isMaxLevel() {
    return this.level >= MAX_LEVEL;
  }

  get xpRatio() {
    return this.isMaxLevel ? 1 : Math.max(0, Math.min(1, this.xp / this.xpToNext));
  }

  addXp(amount) {
    const gain = whole(amount);
    if (!gain || this.isMaxLevel) return 0;
    this.xp += gain;
    let levels = 0;
    while (!this.isMaxLevel && this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      levels += 1;
    }
    if (this.isMaxLevel) this.xp = 0;
    return levels;
  }

  addCash(amount) {
    const gain = whole(amount);
    this.cash += gain;
    return gain;
  }

  spendCash(amount) {
    const cost = whole(amount);
    if (cost > this.cash) return false;
    this.cash -= cost;
    return true;
  }

  restore(snapshot = {}) {
    this.level = Math.max(1, Math.min(MAX_LEVEL, whole(snapshot?.level) || 1));
    this.xp = whole(snapshot?.xp);
    this.cash = whole(snapshot?.cash);
    if (this.isMaxLevel) this.xp = 0;
    else this.xp = Math.min(this.xp, Math.max(0, this.xpToNext - 1));
    return this;
  }

  snapshot() {
    return { level: this.level, xp: this.xp, cash: this.cash };
  }
}
