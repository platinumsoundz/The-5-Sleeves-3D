// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (levels, inventory, skills and tower state)
// Local save slot for progression-shaped data. Versioned and sanitized on both read and write;
// storage is injectable so tests never touch a real localStorage. Older v1 slots that stored flat
// XP/cash are migrated into the new progression object.
import { MAX_LEVEL } from './progression.js';
import { ITEM_SLOTS, itemById } from './items.js';
import { SKILL_TREE } from './skills.js';
import { INVENTORY_CAPACITY, starterInventorySnapshot } from './inventory.js';

export const SAVE_KEY = 'five-sleeves.save.v1';
// Keep one last-known-good snapshot so a truncated browser write can be recovered.
export const SAVE_BACKUP_KEY = 'five-sleeves.save.v1.backup';
export const SAVE_VERSION = 2;

const wholeNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
};

function cleanQuestId(value) {
  return typeof value === 'string' ? value.trim().slice(0, 40) : '';
}

function cleanProgression(raw = {}) {
  const level = Math.max(1, Math.min(MAX_LEVEL, wholeNumber(raw.level) || 1));
  return {
    level,
    xp: level >= MAX_LEVEL ? 0 : wholeNumber(raw.xp),
    cash: wholeNumber(raw.cash)
  };
}

function cleanInventory(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw
    : starterInventorySnapshot();
  const seen = new Set();
  const items = [];
  for (const id of Array.isArray(source.items) ? source.items : []) {
    if (typeof id !== 'string' || !itemById(id) || seen.has(id)) continue;
    seen.add(id);
    items.push(id);
    if (items.length >= INVENTORY_CAPACITY) break;
  }
  const equipped = { weapon: '', armor: '', gear: '' };
  for (const slot of ITEM_SLOTS) {
    const id = source.equipped?.[slot];
    const item = itemById(id);
    if (!item || item.slot !== slot || !seen.has(id)) continue;
    equipped[slot] = id;
  }
  return { items, equipped };
}

function cleanSkills(raw = {}) {
  const ranks = {};
  for (const node of SKILL_TREE) {
    const rank = wholeNumber(raw?.ranks?.[node.id]);
    if (rank) ranks[node.id] = Math.min(node.maxRank, rank);
  }
  const points = raw?.points === undefined ? 1 : Math.min(99, wholeNumber(raw.points));
  return { points, ranks };
}

export function emptySave() {
  return {
    version: SAVE_VERSION,
    tutorialDone: false,
    progression: { level: 1, xp: 0, cash: 0 },
    inventory: starterInventorySnapshot(),
    skills: { points: 1, ranks: {} },
    permissions: [],
    quests: { active: '', completed: [] },
    tower: { entered: false, linked: false },
    savedAt: 0
  };
}

export function sanitizeSave(raw = {}) {
  const permissions = Array.isArray(raw.permissions)
    ? [...new Set(
      raw.permissions
        .filter(entry => typeof entry === 'string' && entry.trim())
        .map(entry => entry.trim().slice(0, 40))
    )].slice(0, 20)
    : [];
  const quests = {
    active: cleanQuestId(raw.quests?.active),
    completed: Array.isArray(raw.quests?.completed)
      ? [...new Set(raw.quests.completed.map(cleanQuestId).filter(Boolean))].slice(0, 40)
      : []
  };
  const progression = cleanProgression(raw.progression || {
    level: raw.level,
    xp: raw.xp,
    cash: raw.cash
  });
  return {
    version: SAVE_VERSION,
    tutorialDone: raw.tutorialDone === true,
    progression,
    inventory: cleanInventory(raw.inventory),
    skills: cleanSkills(raw.skills),
    permissions,
    quests,
    tower: {
      entered: raw.tower?.entered === true,
      linked: raw.tower?.linked === true
    },
    savedAt: wholeNumber(raw.savedAt)
  };
}

function readSlot(storage, key) {
  try {
    const raw = storage?.getItem(key);
    return raw ? sanitizeSave(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function loadSave(storage) {
  // Prefer the newest save, but recover the last good snapshot if it is absent or corrupt.
  return readSlot(storage, SAVE_KEY) || readSlot(storage, SAVE_BACKUP_KEY);
}

export function writeSave(storage, save) {
  const safe = sanitizeSave({ ...save, savedAt: Date.now() });
  try {
    const current = storage?.getItem(SAVE_KEY);
    if (current) {
      // Never replace a usable backup with malformed data from a broken primary slot.
      try {
        const previous = sanitizeSave(JSON.parse(current));
        storage?.setItem(SAVE_BACKUP_KEY, JSON.stringify(previous));
      } catch {
        // Leave the existing backup untouched.
      }
    }
    storage?.setItem(SAVE_KEY, JSON.stringify(safe));
  } catch {
    // In-memory resume still works for this session if storage is blocked.
  }
  return safe;
}

export function deleteSave(storage) {
  try {
    storage?.removeItem(SAVE_KEY);
    storage?.removeItem(SAVE_BACKUP_KEY);
  } catch {
    // Ignore blocked storage.
  }
}
