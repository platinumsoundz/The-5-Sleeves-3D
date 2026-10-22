// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (inventory, equipment and stat bonuses)
// Pure inventory/equipment state. Items are unique prototype entries so a save can round-trip
// without instance IDs; equip slots feed the same stats object used by combat and movement.
import { ITEM_SLOTS, itemById } from './items.js';

export const INVENTORY_CAPACITY = 24;

const emptyEquipped = () => ({ weapon: '', armor: '', gear: '' });

export class Inventory {
  constructor(snapshot = {}) {
    this.items = [];
    this.equipped = emptyEquipped();
    this.restore(snapshot);
  }

  reset() {
    this.items = [];
    this.equipped = emptyEquipped();
    return this;
  }

  restore(snapshot = {}) {
    const seen = new Set();
    this.items = [];
    const source = Array.isArray(snapshot?.items) ? snapshot.items : [];
    for (const id of source) {
      if (typeof id !== 'string' || !itemById(id) || seen.has(id)) continue;
      seen.add(id);
      this.items.push(id);
      if (this.items.length >= INVENTORY_CAPACITY) break;
    }
    this.equipped = emptyEquipped();
    for (const slot of ITEM_SLOTS) {
      const id = snapshot?.equipped?.[slot];
      const item = itemById(id);
      if (!item || item.slot !== slot || !seen.has(id)) continue;
      this.equipped[slot] = id;
    }
    return this;
  }

  get size() {
    return this.items.length;
  }

  get isFull() {
    return this.items.length >= INVENTORY_CAPACITY;
  }

  has(id) {
    return this.items.includes(id);
  }

  add(id) {
    const item = itemById(id);
    if (!item || this.has(id) || this.isFull) return false;
    this.items.push(id);
    return true;
  }

  remove(id) {
    const index = this.items.indexOf(id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    for (const slot of ITEM_SLOTS) {
      if (this.equipped[slot] === id) this.equipped[slot] = '';
    }
    return true;
  }

  equip(id) {
    const item = itemById(id);
    if (!item || !this.has(id)) return false;
    this.equipped[item.slot] = id;
    return true;
  }

  unequip(slot) {
    if (!ITEM_SLOTS.includes(slot) || !this.equipped[slot]) return false;
    this.equipped[slot] = '';
    return true;
  }

  // Weapon stats only count while that weapon kind is active. Armour and gear always count.
  bonuses(activeWeaponKind = '') {
    const total = { attack: 0, defense: 0, speed: 0, maxHp: 0, maxStamina: 0 };
    for (const slot of ITEM_SLOTS) {
      const item = itemById(this.equipped[slot]);
      if (!item) continue;
      if (slot === 'weapon' && item.kind && item.kind !== activeWeaponKind) continue;
      for (const key of Object.keys(total)) {
        const value = Number(item.stats?.[key]);
        if (Number.isFinite(value)) total[key] += value;
      }
    }
    return total;
  }

  entries() {
    return this.items.map(id => {
      const item = itemById(id);
      const equipped = ITEM_SLOTS.some(slot => this.equipped[slot] === id);
      return { ...item, equipped };
    });
  }

  snapshot() {
    return { items: [...this.items], equipped: { ...this.equipped } };
  }
}

export function createStarterInventory() {
  const inventory = new Inventory();
  for (const id of ['training-staff', 'patched-vest', 'field-wrap']) inventory.add(id);
  inventory.equip('training-staff');
  inventory.equip('patched-vest');
  inventory.equip('field-wrap');
  return inventory;
}

export function starterInventorySnapshot() {
  return createStarterInventory().snapshot();
}
