// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
import { Hud } from '../src/hud.js';
// Headless checks for the shell systems: save data, bindings, dev codes, feed, radar, resources.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Resource } from '../src/resources.js';
import { EventFeed } from '../src/log.js';
import { radarOffset } from '../src/radar.js';
import { DEV_CODES, redeemDevCode } from '../src/devcodes.js';
import {
  SAVE_KEY, emptySave, sanitizeSave, loadSave, writeSave, deleteSave
} from '../src/save.js';
import {
  BINDINGS_KEY, DEFAULT_KEYBOARD, DEFAULT_GAMEPAD, sanitizeBindings,
  loadBindings, saveBindings, rebind
} from '../src/bindings.js';

function storage() {
  const map = new Map();
  return {
    map,
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: key => map.delete(key)
  };
}

test('resource spends, holds regeneration, then refills to its cap', () => {
  const stamina = new Resource(100, { regen: 20, delay: .5 });
  assert.equal(stamina.spend(30), true);
  assert.equal(stamina.value, 70);
  assert.equal(stamina.spend(200), false, 'cannot overspend');
  stamina.update(.25);
  assert.equal(stamina.value, 70, 'regeneration waits out the delay');
  stamina.update(.25);
  assert.equal(stamina.value, 70, 'the frame that clears the delay does not regen yet');
  stamina.update(.5);
  assert.equal(stamina.value, 80);
  stamina.update(10);
  assert.equal(stamina.value, 100, 'clamped at max');
  stamina.drain(500, 1);
  assert.equal(stamina.value, 0);
  assert.equal(stamina.ratio, 0);
  stamina.reset();
  assert.equal(stamina.value, 100);
});

test('radar points forward targets up and right targets right', () => {
  const player = { x: 0, z: 0 };
  const forward = radarOffset(player, Math.PI, { x: 0, z: -2 }, 10, 50);
  assert.ok(forward.y < -9, `forward should be up, got ${forward.y}`);
  assert.ok(Math.abs(forward.x) < .001);

  const right = radarOffset(player, 0, { x: 2, z: 0 }, 10, 50);
  assert.ok(right.x > 9, `right should be right, got ${right.x}`);

  const far = radarOffset(player, 0, { x: 0, z: 100 }, 10, 50);
  assert.equal(far.clamped, true);
  assert.ok(Math.hypot(far.x, far.y) <= 50.001);
});

test('event feed keeps only the newest entries', () => {
  const feed = new EventFeed(3);
  feed.push('one');
  feed.push('two', 'good');
  feed.push('three', 'warn');
  feed.push('four', 'bad');
  assert.deepEqual(feed.items.map(entry => entry.text), ['two', 'three', 'four']);
  assert.equal(feed.items[2].kind, 'bad');
  feed.clear();
  assert.equal(feed.items.length, 0);
});

test('save data sanitizes, round-trips and deletes', () => {
  const store = storage();
  assert.equal(loadSave(store), null);
  assert.deepEqual(sanitizeSave({}), emptySave());

  const saved = writeSave(store, {
    tutorialDone: true, xp: 12.9, cash: -5,
    permissions: [' gear ', 'gear', 7, '']
  });
  assert.equal(saved.version, 1);
  assert.equal(saved.tutorialDone, true);
  assert.equal(saved.xp, 12);
  assert.equal(saved.cash, 0);
  assert.deepEqual(saved.permissions, ['gear']);
  assert.ok(saved.savedAt > 0);

  const loaded = loadSave(store);
  assert.deepEqual(loaded, saved);

  store.setItem(SAVE_KEY, '{broken');
  assert.equal(loadSave(store), null);

  deleteSave(store);
  assert.equal(loadSave(store), null);
});

test('developer codes grant placeholder XP, cash and permissions', () => {
  assert.ok(Object.keys(DEV_CODES).length >= 3);
  let save = emptySave();

  const xp = redeemDevCode(save, ' dev-xp-500 ');
  assert.equal(xp.ok, true);
  save = xp.save;
  assert.equal(save.xp, 500);

  const cash = redeemDevCode(save, 'DEV-CASH-1000');
  assert.equal(cash.ok, true);
  save = cash.save;
  assert.equal(save.cash, 1000);

  const gear = redeemDevCode(save, 'DEV-GEAR-SLEEVE');
  assert.deepEqual(gear.save.permissions, ['sleeve-prototype']);
  const again = redeemDevCode(gear.save, 'DEV-GEAR-SLEEVE');
  assert.deepEqual(again.save.permissions, ['sleeve-prototype'], 'permissions are unique');

  const bad = redeemDevCode(save, 'NOPE');
  assert.equal(bad.ok, false);
  assert.equal(bad.save, save, 'unknown codes do not mutate');
});

test('bindings default, sanitize, swap on rebind and persist', () => {
  const defaults = sanitizeBindings();
  assert.deepEqual(defaults.keyboard.forward, DEFAULT_KEYBOARD.forward);
  assert.deepEqual(defaults.gamepad.attack, DEFAULT_GAMEPAD.attack);

  const dirty = sanitizeBindings({
    keyboard: { forward: ['KeyW', 'KeyW'], attack: ['KeyW', 42, ''], menu: [] },
    gamepad: { attack: [7, 7, 99], menu: [] }
  });
  assert.deepEqual(dirty.keyboard.forward, ['KeyW']);
  assert.equal(dirty.keyboard.attack.includes('KeyW'), false, 'one key cannot drive two actions');
  assert.ok(dirty.keyboard.attack.length > 0, 'an action with a default is not left empty');
  assert.deepEqual(dirty.keyboard.menu, ['Escape']);
  assert.deepEqual(dirty.gamepad.menu, [9]);
  assert.equal(dirty.gamepad.attack.every(index => index >= 0 && index <= 17), true);

  const swapped = rebind(defaults, 'keyboard', 'attack', 'KeyW');
  assert.deepEqual(swapped.keyboard.attack, ['KeyW']);
  assert.deepEqual(swapped.keyboard.forward, ['KeyJ'], 'the displaced key keeps forward usable');

  const padSwapped = rebind(defaults, 'gamepad', 'jump', 1);
  assert.deepEqual(padSwapped.gamepad.jump, [1]);
  assert.deepEqual(padSwapped.gamepad.guard, [0]);

  const store = storage();
  saveBindings(store, swapped);
  assert.ok(store.map.has(BINDINGS_KEY));
  assert.deepEqual(loadBindings(store), swapped);
  assert.deepEqual(loadBindings({ getItem: () => '{oops' }), sanitizeBindings());
});

test('HUD sync paints vitals, radar, feed and shell visibility', () => {
  const node = () => ({
    textContent: '', hidden: false, style: {}, dataset: {},
    classList: {
      values: new Set(),
      toggle(name, on) { if (on) this.values.add(name); else this.values.delete(name); },
      contains(name) { return this.values.has(name); }
    },
    setAttribute(name, value) { this[name] = value; }
  });
  const feedLines = Array.from({ length: 6 }, node);
  const ui = {
    phase: node(), playerHealth: node(), senseiHealth: node(), playerStamina: node(), sleeveCharge: node(),
    message: node(), prompt: node(), device: node(), warning: node(), touchControls: node(),
    fire: node(), reticle: node(), pause: node(), skip: node(), restart: node(), result: node(),
    hud: node(), title: node(), resume: node(), settings: node(), mapScreen: node(),
    feedLines, radarSensei: node(), statXp: node(), statCash: node(), statTutorial: node(),
    statPerms: node(), statScore: node(), saveStatus: node(),
    mapPlayers: [node()], mapSenseis: [node()],
    menuPages: { status: node(), system: node() },
    menuTabs: [{ ...node(), dataset: { tab: 'status' } }, { ...node(), dataset: { tab: 'system' } }],
    menuResume: node()
  };
  const hud = new Hud(ui);
  hud.sync({
    screen: 'title', menuTab: 'status', menuFrom: 'title', phase: 'tutorial',
    playerHp: 75, senseiHp: 100, playerScore: 1, senseiScore: 2, needed: 3,
    stamina: .5, sleeve: 1, xp: 12, cash: 34, tutorialDone: false, permissions: ['gear'],
    hasSave: false, warning: true, message: 'm', prompt: 'p', device: 'INPUT: TOUCH',
    touch: true, aiming: true, result: '', showSkip: true, showRestart: false,
    player: { x: 0, z: 0, yaw: Math.PI }, sensei: { x: 0, z: -5 }, arena: 5,
    feed: [{ text: 'first', kind: 'good' }, { text: 'second', kind: 'bad' }]
  });

  assert.equal(ui.hud.hidden, true);
  assert.equal(ui.title.hidden, false);
  assert.equal(ui.settings.hidden, true);
  assert.equal(ui.mapScreen.hidden, true);
  assert.equal(ui.touchControls.hidden, true);
  assert.equal(ui.playerHealth.style.width, '75%');
  assert.equal(ui.playerStamina.style.width, '50%');
  assert.equal(ui.sleeveCharge.style.width, '100%');
  assert.equal(ui.resume.disabled, true);
  assert.equal(ui.menuResume.textContent, 'BACK');
  assert.equal(ui.statXp.textContent, '12');
  assert.equal(ui.statCash.textContent, '34');
  assert.equal(ui.statPerms.textContent, 'gear');
  assert.equal(feedLines[0].textContent, 'first');
  assert.equal(feedLines[1].className, 'feed-line bad');
  assert.equal(feedLines[2].hidden, true);
  assert.ok(ui.radarSensei.style.transform.includes('-40'), ui.radarSensei.style.transform);
  assert.equal(ui.mapPlayers[0].style.left, '50%');
  assert.equal(ui.mapSenseis[0].style.top, '92%');
  assert.equal(ui.menuTabs[0].classList.contains('active'), true);
  assert.equal(ui.menuTabs[1].classList.contains('active'), false);
  assert.equal(ui.menuPages.status.hidden, false);
  assert.equal(ui.menuPages.system.hidden, true);
});
