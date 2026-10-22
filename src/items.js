// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (inventory items, rarity and stat rolls)
// Presentation-neutral item catalogue. These are prototype equipment values, not canon lore.
// `kind` on a weapon limits its bonus to that loadout entry; armour and gear always apply.
export const RARITIES = Object.freeze({
  common: { label: 'COMMON', color: '#aab3ae', order: 0 },
  uncommon: { label: 'UNCOMMON', color: '#79c986', order: 1 },
  rare: { label: 'RARE', color: '#6db7e8', order: 2 },
  epic: { label: 'EPIC', color: '#c08cf0', order: 3 },
  legendary: { label: 'LEGENDARY', color: '#e8b75f', order: 4 }
});

const ITEMS = [
  {
    id: 'training-staff', name: 'TRAINING STAFF', slot: 'weapon', kind: 'staff', rarity: 'common',
    value: 40, levelReq: 1, stats: { attack: 2 },
    description: 'A balanced practice staff. Familiar, honest and easy to replace.'
  },
  {
    id: 'reinforced-staff', name: 'REINFORCED STAFF', slot: 'weapon', kind: 'staff', rarity: 'uncommon',
    value: 120, levelReq: 2, stats: { attack: 4, defense: 1 },
    description: 'A training staff wrapped with repair wire and a heavier striking end.'
  },
  {
    id: 'field-katana', name: 'FIELD KATANA', slot: 'weapon', kind: 'katana', rarity: 'rare',
    value: 320, levelReq: 3, stats: { attack: 7, speed: .02 },
    description: 'A short, practical blade with a repaired guard and a worn grip.'
  },
  {
    id: 'patched-vest', name: 'PATCHED VEST', slot: 'armor', rarity: 'common',
    value: 60, levelReq: 1, stats: { defense: 3 },
    description: 'Layered cloth and old plating. It will stop a glancing blow.'
  },
  {
    id: 'filter-coat', name: 'FILTER COAT', slot: 'armor', rarity: 'uncommon',
    value: 180, levelReq: 2, stats: { defense: 5, maxStamina: 6 },
    description: 'A weatherproof coat with filter pockets and reinforced seams.'
  },
  {
    id: 'field-wrap', name: 'FIELD WRAP', slot: 'gear', rarity: 'common',
    value: 70, levelReq: 1, stats: { maxHp: 8 },
    description: 'Compression wrap, cord and a small field dressing. Built for long walks.'
  },
  {
    id: 'scout-boots', name: 'SCOUT BOOTS', slot: 'gear', rarity: 'uncommon',
    value: 140, levelReq: 2, stats: { speed: .06 },
    description: 'Light soles with good grip. The road feels shorter in them.'
  },
  {
    id: 'precision-grip', name: 'PRECISION GRIP', slot: 'gear', rarity: 'rare',
    value: 260, levelReq: 3, stats: { attack: 3, speed: .02 },
    description: 'A weighted grip wrap and wrist brace that make the first strike count.'
  },
  {
    id: 'guardian-plate', name: 'GUARDIAN PLATE', slot: 'armor', rarity: 'epic',
    value: 600, levelReq: 5, stats: { defense: 10, maxHp: 12, speed: -.03 },
    description: 'A heavy recovered plate. It trades a little speed for serious protection.'
  }
];

export const ITEM_DEFINITIONS = Object.freeze(ITEMS.map(item => Object.freeze({
  ...item,
  stats: Object.freeze({ ...item.stats })
})));

export const ITEM_BY_ID = Object.freeze(Object.fromEntries(
  ITEM_DEFINITIONS.map(item => [item.id, item])
));

export const ITEM_SLOTS = Object.freeze(['weapon', 'armor', 'gear']);

export function itemById(id) {
  return ITEM_BY_ID[id] || null;
}

export function rarityOf(item) {
  return RARITIES[item?.rarity] || RARITIES.common;
}

export function itemStatLine(item) {
  const stats = item?.stats || {};
  return [
    Number(stats.attack) ? `ATK +${stats.attack}` : '',
    Number(stats.defense) ? `DEF +${stats.defense}` : '',
    Number(stats.maxHp) ? `HP +${stats.maxHp}` : '',
    Number(stats.maxStamina) ? `STA +${stats.maxStamina}` : '',
    Number(stats.speed) ? `SPD ${stats.speed > 0 ? '+' : ''}${Math.round(stats.speed * 100)}%` : ''
  ].filter(Boolean).join(' · ');
}
