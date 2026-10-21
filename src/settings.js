// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Player-facing options: look sensitivity, vertical inversion and render quality.
// Pure data + a storage parameter, so it is testable without a browser localStorage.
export const SETTINGS_KEY = 'five-sleeves.settings.v1';

export const DEFAULTS = Object.freeze({
  sensitivity: 1,
  invertY: false,
  quality: 'balanced'
});

const QUALITIES = new Set(['performance', 'balanced', 'sharp']);

export function sanitize(raw = {}) {
  const sensitivity = Number(raw?.sensitivity);
  return {
    sensitivity: Number.isFinite(sensitivity)
      ? Math.min(2, Math.max(.4, sensitivity))
      : DEFAULTS.sensitivity,
    invertY: raw?.invertY === true || raw?.invertY === 'true',
    quality: QUALITIES.has(raw?.quality) ? raw.quality : DEFAULTS.quality
  };
}

export function loadSettings(storage) {
  try {
    return sanitize(JSON.parse(storage?.getItem(SETTINGS_KEY) || '{}'));
  } catch {
    return sanitize({});
  }
}

export function saveSettings(storage, settings) {
  const safe = sanitize(settings);
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(safe));
  } catch {
    // Private mode or a full quota should never block play.
  }
  return safe;
}
