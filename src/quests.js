// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery/outpost pass)
// Pure quest catalogue and one-active-at-a-time quest log. Definitions stay data-shaped so
// more quests, regions and objective kinds can be added without touching the menu or HUD.
import { CONFIG } from './config.js';

export const QUEST_DEFINITIONS = Object.freeze([
  {
    id: 'scout-outpost',
    title: 'Scout the Enemy Outpost',
    summary: 'Follow the north track through the gate and past the raiders until the occupied outpost comes into view.',
    objective: 'Reach the enemy outpost',
    hint: 'North gate → wilderness track',
    targetZone: 'wilds',
    target: { x: CONFIG.wildOutpostX, z: CONFIG.wildOutpostZ },
    rewardXp: 150,
    progress: progress => progress.outpostReached ? 'Outpost reached' : 'Outpost not reached',
    check: progress => progress.outpostReached === true
  },
  {
    id: 'clear-approach',
    title: 'Clear the Approach',
    summary: 'Four raiders hold the wilderness road. Knock every one down; the fight stays nonlethal.',
    objective: 'Knock down all four raiders',
    hint: 'Nearest standing raider',
    targetZone: 'wilds',
    target: { x: 0, z: -38 },
    targetKind: 'nearest-raider',
    rewardXp: 200,
    progress: progress => `${Math.min(progress.raidersDefeated, progress.raidersTotal)} / ${progress.raidersTotal} raiders down`,
    check: progress => progress.raidersTotal > 0
      && progress.raidersDefeated >= progress.raidersTotal
  },
  {
    id: 'prove-lesson',
    title: 'Prove the Lesson',
    summary: 'Win a free spar against Sensei. First to three knockdowns takes the round, and no blow is lethal.',
    objective: 'Win a spar against Sensei',
    hint: 'Sensei in the training yard',
    targetZone: 'training',
    target: { x: 0, z: -2.5 },
    targetKind: 'sensei',
    rewardXp: 100,
    progress: progress => progress.sparWon ? 'Spar won' : 'First to 3 knockdowns',
    check: progress => progress.sparWon === true
  }
]);

export const QUEST_BY_ID = Object.freeze(Object.fromEntries(
  QUEST_DEFINITIONS.map(quest => [quest.id, quest])
));

// Older saves called this objective "first tower". Keep them loadable after it became an
// enemy outpost; no canon tower is being added to the game.
const LEGACY_QUEST_IDS = Object.freeze({ 'first-tower': 'scout-outpost' });

export function questById(id) {
  const migrated = LEGACY_QUEST_IDS[id] || id;
  return QUEST_BY_ID[migrated] || null;
}

// The map arrow always has somewhere useful to point. If the objective is in the other zone,
// point at the gate first instead of drawing a meaningless line through the training wall.
export function resolveQuestTarget(quest, {
  zone = 'training',
  gate = { x: 0, z: -10.6 },
  nearestRaider = null,
  sensei = null
} = {}) {
  if (!quest) return null;
  if (quest.targetZone && zone !== quest.targetZone) return gate;
  if (quest.targetKind === 'nearest-raider') return nearestRaider || quest.target;
  if (quest.targetKind === 'sensei') return sensei || quest.target;
  return quest.target;
}

export class QuestLog {
  constructor(snapshot = {}) {
    this.completed = new Set();
    this.active = '';
    this.restore(snapshot);
  }

  restore(snapshot = {}) {
    const known = new Set(QUEST_DEFINITIONS.map(quest => quest.id));
    const migrate = id => LEGACY_QUEST_IDS[id] || id;
    const completed = Array.isArray(snapshot?.completed) ? snapshot.completed : [];
    this.completed = new Set(
      completed
        .filter(id => typeof id === 'string')
        .map(migrate)
        .filter(id => known.has(id))
        .slice(0, QUEST_DEFINITIONS.length)
    );
    const active = typeof snapshot?.active === 'string' ? migrate(snapshot.active) : '';
    this.active = known.has(active) && !this.completed.has(active) ? active : '';
    return this;
  }

  reset() {
    this.completed.clear();
    this.active = '';
    return this;
  }

  select(id) {
    const quest = questById(id);
    if (!quest || this.completed.has(quest.id) || this.active === quest.id) return false;
    this.active = quest.id;
    return true;
  }

  clear() {
    if (!this.active) return false;
    this.active = '';
    return true;
  }

  get activeQuest() {
    return questById(this.active);
  }

  entries(progress = {}) {
    return QUEST_DEFINITIONS.map(quest => ({
      id: quest.id,
      title: quest.title,
      summary: quest.summary,
      objective: quest.objective,
      hint: quest.hint,
      rewardXp: quest.rewardXp,
      status: this.completed.has(quest.id)
        ? 'completed'
        : this.active === quest.id ? 'active' : 'available',
      progressLabel: quest.progress(progress)
    }));
  }

  // Returns the quest that just completed, or null. Exactly one quest can be active, so this
  // is also the only place that can clear the active slot.
  check(progress = {}) {
    const quest = this.activeQuest;
    if (!quest || !quest.check(progress)) return null;
    this.completed.add(quest.id);
    this.active = '';
    return quest;
  }

  snapshot() {
    return { active: this.active, completed: [...this.completed] };
  }
}
