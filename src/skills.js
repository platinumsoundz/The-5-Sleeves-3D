// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (skill tree and passive bonuses)
// Three small branches keep the first skill tree readable: movement, defence and conditioning.
// Every node is a passive stat bonus, so no unapproved Cipher ability or story power is implied.
export const SKILL_TREE = Object.freeze([
  {
    id: 'footwork', name: 'FOOTWORK', branch: 'MOVEMENT',
    description: '+4% movement speed per rank.',
    maxRank: 2, cost: 1, requires: [], perRank: { speed: .04 }
  },
  {
    id: 'counter-step', name: 'COUNTER STEP', branch: 'MOVEMENT',
    description: '+5% movement speed after the basic footwork drills.',
    maxRank: 1, cost: 1, requires: ['footwork'], perRank: { speed: .05 }
  },
  {
    id: 'iron-guard', name: 'IRON GUARD', branch: 'DEFENCE',
    description: '+3 defence per rank, reducing incoming damage.',
    maxRank: 3, cost: 1, requires: [], perRank: { defense: 3 }
  },
  {
    id: 'conditioning', name: 'CONDITIONING', branch: 'CONDITIONING',
    description: '+8 maximum health per rank.',
    maxRank: 3, cost: 1, requires: [], perRank: { maxHp: 8 }
  },
  {
    id: 'breath-control', name: 'BREATH CONTROL', branch: 'CONDITIONING',
    description: '+8 maximum stamina per rank.',
    maxRank: 2, cost: 1, requires: ['conditioning'], perRank: { maxStamina: 8 }
  },
  {
    id: 'staff-forms', name: 'STAFF FORMS', branch: 'STRIKING',
    description: '+2 melee attack per rank.',
    maxRank: 3, cost: 1, requires: [], perRank: { attack: 2 }
  },
  {
    id: 'weak-point', name: 'WEAK POINT', branch: 'STRIKING',
    description: '+3 melee attack, but only after the staff forms and footwork drills.',
    maxRank: 1, cost: 1, requires: ['staff-forms', 'footwork'], perRank: { attack: 3 }
  },
  {
    id: 'field-repair', name: 'FIELD REPAIR', branch: 'DEFENCE',
    description: '+2 defence and +6 maximum health. Practical recovery, not a power.',
    maxRank: 1, cost: 1, requires: ['iron-guard'], perRank: { defense: 2, maxHp: 6 }
  }
]);

export const SKILL_BY_ID = Object.freeze(Object.fromEntries(
  SKILL_TREE.map(node => [node.id, node])
));

const whole = value => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
};

export class SkillTree {
  constructor(snapshot = {}) {
    this.ranks = {};
    this.points = 1;
    this.restore(snapshot);
  }

  reset() {
    this.ranks = {};
    this.points = 1;
    return this;
  }

  addPoints(amount) {
    this.points += whole(amount);
    return this.points;
  }

  rank(id) {
    return whole(this.ranks[id]);
  }

  canUnlock(id) {
    const node = SKILL_BY_ID[id];
    if (!node) return { ok: false, reason: 'Unknown skill.' };
    if (this.rank(id) >= node.maxRank) return { ok: false, reason: 'Already mastered.' };
    if (this.points < node.cost) return { ok: false, reason: 'No skill points available.' };
    for (const requirement of node.requires) {
      if (this.rank(requirement) < 1) {
        return { ok: false, reason: `Requires ${SKILL_BY_ID[requirement]?.name || requirement}.` };
      }
    }
    return { ok: true, reason: '' };
  }

  unlock(id) {
    const check = this.canUnlock(id);
    if (!check.ok) return { ok: false, message: check.reason };
    const node = SKILL_BY_ID[id];
    this.points -= node.cost;
    this.ranks[id] = this.rank(id) + 1;
    return { ok: true, node, rank: this.ranks[id], message: `${node.name} rank ${this.ranks[id]} learned.` };
  }

  bonuses() {
    const total = { attack: 0, defense: 0, speed: 0, maxHp: 0, maxStamina: 0 };
    for (const [id, rank] of Object.entries(this.ranks)) {
      const node = SKILL_BY_ID[id];
      if (!node) continue;
      for (const key of Object.keys(total)) {
        const value = Number(node.perRank?.[key]);
        if (Number.isFinite(value)) total[key] += value * rank;
      }
    }
    return total;
  }

  view() {
    return SKILL_TREE.map(node => {
      const check = this.canUnlock(node.id);
      return {
        ...node,
        rank: this.rank(node.id),
        locked: node.requires.some(id => this.rank(id) < 1),
        canUnlock: check.ok,
        reason: check.reason
      };
    });
  }

  restore(snapshot = {}) {
    this.ranks = {};
    for (const node of SKILL_TREE) {
      const rank = whole(snapshot?.ranks?.[node.id]);
      if (rank) this.ranks[node.id] = Math.min(node.maxRank, rank);
    }
    // A new character starts with one point so the first level-up choice is available
    // immediately. An explicit saved value (including zero) still wins.
    this.points = snapshot?.points === undefined ? 1 : Math.min(99, whole(snapshot.points));
    return this;
  }

  snapshot() {
    return { points: this.points, ranks: { ...this.ranks } };
  }
}
