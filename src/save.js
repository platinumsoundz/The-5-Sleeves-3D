// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)
// Local save slot for progression-shaped data. Versioned and sanitized on both read and write;
// storage is injectable so tests never touch a real localStorage.
export const SAVE_KEY = 'five-sleeves.save.v1';
export const SAVE_VERSION = 1;

export function emptySave() {
  return {
    version: SAVE_VERSION,
    tutorialDone: false,
    xp: 0,
    cash: 0,
    permissions: [],
    quests: { active: '', completed: [] },
    savedAt: 0
  };
}

const wholeNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
};

function cleanQuestId(value) {
  return typeof value === 'string' ? value.trim().slice(0, 40) : '';
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
  return {
    version: SAVE_VERSION,
    tutorialDone: raw.tutorialDone === true,
    xp: wholeNumber(raw.xp),
    cash: wholeNumber(raw.cash),
    permissions,
    quests,
    savedAt: wholeNumber(raw.savedAt)
  };
}

export function loadSave(storage) {
  try {
    const raw = storage?.getItem(SAVE_KEY);
    if (!raw) return null;
    return sanitizeSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeSave(storage, save) {
  const safe = sanitizeSave({ ...save, savedAt: Date.now() });
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(safe));
  } catch {
    // In-memory resume still works for this session if storage is blocked.
  }
  return safe;
}

export function deleteSave(storage) {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // Ignore blocked storage.
  }
}
