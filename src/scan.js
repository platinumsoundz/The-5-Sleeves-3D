// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (Cipher enemy scan readout)
// The early Cipher Sleeve only produces a limited tactical scan: level, vitals, observed
// capabilities and a physical weakness. It does not reveal story knowledge or future powers.
const WEAPON_ABILITIES = Object.freeze({
  staff: ['STAFF SWEEP', 'GUARD', 'PARRY', 'DODGE'],
  katana: ['QUICK SLASH', 'GUARD', 'PARRY', 'DODGE'],
  unarmed: ['CLOSE STRIKE', 'GUARD', 'PARRY', 'DODGE']
});

const DEFAULT_WEAKNESSES = Object.freeze([
  'Guard pressure breaks after repeated blocks.',
  'Recovery leaves a short opening after a missed swing.'
]);

export function scanEnemy(enemy) {
  if (!enemy) return null;
  const state = enemy.state || {};
  const ai = enemy.ai || {};
  const maxHp = Math.max(1, Number(state.maxHp) || 1);
  const hp = Math.max(0, Math.min(maxHp, Number(state.hp) || 0));
  const abilities = enemy.abilities?.length
    ? [...enemy.abilities]
    : WEAPON_ABILITIES[enemy.weapon] || WEAPON_ABILITIES.staff;
  const weaknesses = enemy.weaknesses?.length
    ? [...enemy.weaknesses]
    : DEFAULT_WEAKNESSES;
  return {
    id: enemy.id || 'enemy',
    name: enemy.name || 'UNKNOWN CONTACT',
    level: Math.max(1, Number(enemy.level) || 1),
    hp: Math.ceil(hp),
    maxHp: Math.ceil(maxHp),
    healthPercent: Math.round((hp / maxHp) * 100),
    state: state.isDown ? 'DOWN'
      : ai.alert === 'spotted' ? 'HOSTILE'
        : ai.alert === 'suspicious' ? 'ALERT' : 'CALM',
    abilities,
    weaknesses,
    confidence: enemy.scannedBefore ? 'CACHED' : 'LIVE',
    note: 'Partial Cipher readout. Capability does not reveal intent or memory.'
  };
}
