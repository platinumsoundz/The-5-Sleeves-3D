// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// Weapon/loadout catalogue. Rules stay in game.js; this only holds tunable stats and labels.
// The Cipher Sleeve entry is a temporary test loadout, not story acquisition or canon powers.
import { CONFIG } from './config.js';

export const WEAPON_ORDER = ['staff', 'katana', 'unarmed', 'cipher'];

export const UNARMED_MOVES = [
  { id: 'punch', label: 'PUNCH', damage: 7, range: 1.55, cooldown: .34, anim: .22, knockback: .05 },
  { id: 'kick', label: 'KICK', damage: 10, range: 1.9, cooldown: .48, anim: .3, knockback: .12 },
  { id: 'grab', label: 'GRAB', damage: 4, range: 1.75, cooldown: .6, anim: .34, knockback: .05, stagger: 1.05 }
];

const CATALOGUE = {
  staff: { id: 'staff', name: 'TRAINING STAFF', short: 'STAFF', kind: 'staff', icon: 'STAFF' },
  katana: { id: 'katana', name: 'KATANA', short: 'KATANA', kind: 'blade', icon: 'KATANA', damage: 17, range: 2.5, cooldown: .5, anim: .24, knockback: .25 },
  unarmed: { id: 'unarmed', name: 'UNARMED', short: 'UNARMED', kind: 'unarmed', icon: 'FISTS' },
  cipher: { id: 'cipher', name: 'CIPHER SLEEVE · TEST', short: 'SLEEVE · TEST', kind: 'sleeve', icon: 'TEST', testOnly: true, damage: 26, range: 3.1, cooldown: .9, anim: .34, knockback: .32 }
};

export function weaponById(id) {
  const found = CATALOGUE[id] || CATALOGUE.staff;
  if (found.id === 'staff') {
    // Staff stays wired to CONFIG so existing tuning and tests keep one source of truth.
    return { ...found, damage: CONFIG.damage, range: CONFIG.range, cooldown: CONFIG.attackCooldown, anim: CONFIG.attackAnimTime, knockback: CONFIG.knockback };
  }
  return { ...found };
}

export function cycleWeapon(current, direction = 1, available = WEAPON_ORDER) {
  const index = Math.max(0, available.indexOf(current));
  return available[(index + direction + available.length) % available.length];
}
