// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Developer/cheat codes. The registry is deliberately tiny until XP, cash and gear exist;
// effects are pure save-object transforms so codes are easy to add and test later.
export const DEV_CODES = Object.freeze({
  'DEV-XP-500': { label: 'Gained 500 XP (dev).', apply: save => ({ ...save, xp: (save.xp || 0) + 500 }) },
  'DEV-CASH-1000': { label: 'Gained 1000 cash (dev).', apply: save => ({ ...save, cash: (save.cash || 0) + 1000 }) },
  'DEV-GEAR-SLEEVE': {
    label: 'Sleeve prototype permission granted (dev).',
    apply: save => ({
      ...save,
      permissions: [...new Set([...(save.permissions || []), 'sleeve-prototype'])]
    })
  }
});

export function redeemDevCode(save, raw) {
  const code = String(raw || '').trim().toUpperCase();
  const entry = DEV_CODES[code];
  if (!entry) return { save, ok: false, message: 'Unknown code.' };
  return { save: entry.apply(save), ok: true, message: entry.label };
}
