// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (levels, cash and gear effects)
// Developer/cheat codes. Effects are returned as explicit increments so the game can route XP
// through the real level curve, cash through the real ledger and permissions into the save.
export const DEV_CODES = Object.freeze({
  'DEV-XP-500': {
    label: 'Gained 500 XP (dev).',
    xp: 500
  },
  'DEV-CASH-1000': {
    label: 'Gained 1000 cash (dev).',
    cash: 1000
  },
  'DEV-GEAR-SLEEVE': {
    label: 'Sleeve prototype permission granted (dev).',
    permission: 'sleeve-prototype'
  },
  'DEV-GEAR-FIELD': {
    label: 'Granted a field kit (dev).',
    items: ['reinforced-staff', 'scout-boots', 'filter-coat']
  }
});

export function redeemDevCode(save, raw) {
  const code = String(raw || '').trim().toUpperCase();
  const entry = DEV_CODES[code];
  if (!entry) return { save, ok: false, message: 'Unknown code.', effect: null };

  const effect = {
    xp: entry.xp || 0,
    cash: entry.cash || 0,
    permission: entry.permission || '',
    items: Array.isArray(entry.items) ? [...entry.items] : []
  };
  let next = { ...save };
  if (effect.xp) next.xp = (next.xp || 0) + effect.xp;
  if (effect.cash) next.cash = (next.cash || 0) + effect.cash;
  if (effect.permission) {
    next.permissions = [...new Set([...(next.permissions || []), effect.permission])];
  }
  return { save: next, ok: true, message: entry.label, effect };
}
