// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (sleeve HUD gating)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (collision, outpost, story deck)
import { Hud } from '../src/hud.js';
// Headless checks for the shell systems: save data, bindings, dev codes, feed, radar, resources.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { detectTouchCapability } from '../src/device.js';
import { Resource } from '../src/resources.js';
import { EventFeed } from '../src/log.js';
import { radarOffset } from '../src/radar.js';
import { QuestLog, resolveQuestTarget, questById, QUEST_DEFINITIONS } from '../src/quests.js';
import { WORLD_MAP, projectMapBounds, projectMapPoint } from '../src/worldmap.js';
import { resolveSolidCollisions, circleCollider, boxCollider } from '../src/collision.js';
import { STORY_PAGES, StoryDeck } from '../src/story.js';
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

test('device detection keeps iPadOS touch controls and ignores ordinary desktops', () => {
  assert.equal(detectTouchCapability({
    maxTouchPoints: 5,
    coarsePointer: true,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    platform: 'MacIntel'
  }), true, 'iPadOS reports a Macintosh user agent but has touch points');

  assert.equal(detectTouchCapability({ maxTouchPoints: 0, userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' }), false);
  assert.equal(detectTouchCapability({
    maxTouchPoints: 10,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }), false, 'a touchscreen laptop with a fine pointer is not treated as a tablet');
  assert.equal(detectTouchCapability({
    maxTouchPoints: 5,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36'
  }), true);
});

test('PWA manifest exposes installable icons and the worker precaches the shell', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of manifest.icons) {
    await access(new URL(`../${icon.src}`, import.meta.url));
  }
  const runtimeIcons = {
    'icons/icon-192.png': [192, 192],
    'icons/icon-512.png': [512, 512],
    'icons/icon-maskable-512.png': [512, 512],
    'icons/apple-touch-icon.png': [180, 180],
    'icons/favicon-32.png': [32, 32]
  };
  for (const [path, [width, height]] of Object.entries(runtimeIcons)) {
    const png = await readFile(new URL(`../${path}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), width, `${path} width`);
    assert.equal(png.readUInt32BE(20), height, `${path} height`);
  }
  const worker = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  assert.match(worker, /src\/device\.js/);
  assert.match(worker, /src\/collision\.js/);
  assert.match(worker, /src\/story\.js/);
  assert.match(worker, /src\/main\.js/);
  assert.match(worker, /five-sleeves-shell-v3/);
  assert.match(worker, /three@0\.160\.0/);
});

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

test('radar is a follow view: moving player and target together keeps the bearing', () => {
  const first = radarOffset({ x: 0, z: 0 }, Math.PI, { x: 3, z: -4 }, 10, 50);
  const moved = radarOffset({ x: 19, z: -38 }, Math.PI, { x: 22, z: -42 }, 10, 50);
  assert.ok(Math.abs(first.x - moved.x) < 1e-9);
  assert.ok(Math.abs(first.y - moved.y) < 1e-9);
});

test('quests allow exactly one active quest and complete only the active one', () => {
  const log = new QuestLog();
  assert.equal(log.entries().every(quest => quest.status === 'available'), true);

  assert.equal(log.select('scout-outpost'), true);
  assert.equal(log.select('clear-approach'), true);
  assert.equal(log.active, 'clear-approach', 'selecting a second quest replaces the first');
  assert.equal(log.entries().filter(quest => quest.status === 'active').length, 1);
  assert.equal(log.select('missing-quest'), false, 'unknown quests cannot be tracked');
  assert.equal(log.select('clear-approach'), false, 'the active quest is already tracked');

  assert.equal(log.check({ raidersDefeated: 2, raidersTotal: 4 }), null);
  const completed = log.check({ raidersDefeated: 4, raidersTotal: 4 });
  assert.equal(completed.id, 'clear-approach');
  assert.equal(log.active, '', 'completion clears the active slot');
  assert.equal(log.entries().find(quest => quest.id === 'clear-approach').status, 'completed');
  assert.equal(log.select('clear-approach'), false, 'completed quests cannot be re-tracked');

  const restored = new QuestLog(log.snapshot());
  assert.equal(restored.active, '');
  assert.ok(restored.snapshot().completed.includes('clear-approach'));
});

test('quest targets point at the objective, or at the gate while in the other zone', () => {
  const outpost = QUEST_DEFINITIONS.find(quest => quest.id === 'scout-outpost');
  assert.deepEqual(resolveQuestTarget(outpost, { zone: 'wilds' }), outpost.target);
  assert.deepEqual(resolveQuestTarget(outpost, { zone: 'training', gate: { x: 0, z: -10.6 } }), { x: 0, z: -10.6 });

  const raiders = QUEST_DEFINITIONS.find(quest => quest.id === 'clear-approach');
  const raider = { x: 8, z: -30 };
  assert.deepEqual(resolveQuestTarget(raiders, { zone: 'wilds', nearestRaider: raider }), raider);
});

test('older first-tower saves migrate to the enemy-outpost objective', () => {
  const completed = new QuestLog({ completed: ['first-tower'], active: 'first-tower' });
  assert.ok(completed.completed.has('scout-outpost'));
  assert.equal(completed.active, '', 'a completed quest cannot remain active');

  const active = new QuestLog({ completed: [], active: 'first-tower' });
  assert.equal(active.active, 'scout-outpost');
  assert.equal(questById('first-tower').title, 'Scout the Enemy Outpost');
});

test('solid colliders push actors out of circles and rotated boxes', () => {
  const position = { x: 1.2, z: 0 };
  assert.equal(resolveSolidCollisions(position, .5, [circleCollider(0, 0, 1)]), true);
  assert.ok(Math.abs(position.x - 1.5) < 1e-9);
  assert.equal(position.z, 0);

  const rotated = { x: 0, z: 1.2 };
  assert.equal(resolveSolidCollisions(rotated, .5, [boxCollider(0, 0, 1, 2, Math.PI / 2)]), true);
  assert.ok(Math.abs(rotated.z - 1.5) < 1e-9, 'the box is rotated so its narrow world-z face stops the actor');

  const clear = { x: 8, z: 8 };
  assert.equal(resolveSolidCollisions(clear, .5, [circleCollider(0, 0, 1)]), false);
  assert.deepEqual(clear, { x: 8, z: 8 });
});

test('story pages advance to a final exit without inventing another tower', () => {
  assert.ok(STORY_PAGES.length >= 5);
  assert.ok(STORY_PAGES.every(page => page.id && page.title && page.body.length));
  assert.equal(STORY_PAGES.some(page => /tower/i.test(`${page.title} ${page.body.join(' ')}`)), false);

  const deck = new StoryDeck();
  assert.equal(deck.index, 0);
  assert.equal(deck.isLast, false);
  assert.equal(deck.next(), true);
  assert.equal(deck.index, 1);
  while (deck.next()) { /* walk to the end */ }
  assert.equal(deck.isLast, true);
  assert.equal(deck.next(), false, 'the last page waits for Exit rather than wrapping');
  deck.reset();
  assert.equal(deck.index, 0);
});

test('world map projection is bounds-driven and keeps north at the top', () => {
  const bounds = { minX: -10, maxX: 10, minZ: -20, maxZ: 20 };
  const centre = projectMapPoint({ x: 0, z: 0 }, bounds, 5);
  assert.equal(centre.left, 50);
  assert.equal(centre.top, 50);
  const north = projectMapPoint({ x: 0, z: -20 }, bounds, 5);
  assert.ok(north.top < centre.top, 'negative z is up-screen');

  const training = WORLD_MAP.regions.find(region => region.id === 'training-yard');
  const frame = projectMapBounds(training.bounds);
  assert.ok(frame.width > 0 && frame.height > 0);
  assert.ok(frame.left >= 5 && frame.left + frame.width <= 95.001);
  assert.equal(WORLD_MAP.bounds.minZ < training.bounds.minZ, true, 'the map has room for expansion');
  const outpost = WORLD_MAP.points.find(point => point.id === 'outpost');
  assert.equal(outpost.label, 'ENEMY OUTPOST');
  assert.equal(outpost.kind, 'outpost');
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
    permissions: [' gear ', 'gear', 7, ''],
    quests: { active: ' scout-outpost ', completed: ['clear-approach', 'clear-approach', 7, ''] }
  });
  assert.equal(saved.version, 1);
  assert.equal(saved.tutorialDone, true);
  assert.equal(saved.xp, 12);
  assert.equal(saved.cash, 0);
  assert.deepEqual(saved.permissions, ['gear']);
  assert.deepEqual(saved.quests, { active: 'scout-outpost', completed: ['clear-approach'] });
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
    phase: node(), playerHealth: node(), senseiHealth: node(), playerStamina: node(),
    sleeveVital: node(), sleeveCharge: node(),
    message: node(), prompt: node(), device: node(), warning: node(), touchControls: node(),
    fire: node(), reticle: node(), pause: node(), skip: node(), restart: node(), result: node(),
    hud: node(), title: node(), resume: node(), settings: node(), mapScreen: node(),
    feedLines, radarSensei: node(), radarQuest: node(),
    quest: node(), questTitle: node(), questProgress: node(), questDistance: node(),
    statXp: node(), statCash: node(), statTutorial: node(),
    statPerms: node(), statScore: node(), saveStatus: node(),
    mapPlayers: [node()], mapSenseis: [node()], mapQuests: [node()],
    menuPages: { status: node(), system: node() },
    menuTabs: [{ ...node(), dataset: { tab: 'status' } }, { ...node(), dataset: { tab: 'system' } }],
    menuResume: node()
  };
  const hud = new Hud(ui);
  const paintState = {
    screen: 'title', menuTab: 'status', menuFrom: 'title', phase: 'tutorial',
    playerHp: 75, senseiHp: 100, playerScore: 1, senseiScore: 2, needed: 3,
    stamina: .5, sleeveAcquired: false, xp: 12, cash: 34, tutorialDone: false, permissions: ['gear'],
    hasSave: false, warning: true, message: 'm', prompt: 'p', device: 'INPUT: TOUCH',
    touch: true, aiming: true, result: '', showSkip: true, showRestart: false,
    player: { x: 0, z: 0, yaw: Math.PI }, sensei: { x: 0, z: -5 }, arena: 5, radarRange: 6,
    map: { bounds: { minX: -10, maxX: 10, minZ: -10, maxZ: 10 } },
    activeQuest: {
      id: 'scout-outpost', title: 'Scout the Enemy Outpost', objective: 'Reach the enemy outpost',
      progressLabel: 'Outpost not reached', target: { x: 0, z: -5 }, distance: 5
    },
    feed: [{ text: 'first', kind: 'good' }, { text: 'second', kind: 'bad' }]
  };
  hud.sync(paintState);

  assert.equal(ui.hud.hidden, true);
  assert.equal(ui.title.hidden, false);
  assert.equal(ui.settings.hidden, true);
  assert.equal(ui.mapScreen.hidden, true);
  assert.equal(ui.touchControls.hidden, true);
  assert.equal(ui.playerHealth.style.width, '75%');
  assert.equal(ui.playerStamina.style.width, '50%');
  assert.equal(ui.sleeveVital.hidden, true, 'the sleeve meter stays hidden before acquisition');
  hud.sync({ ...paintState, sleeveAcquired: true });
  assert.equal(ui.sleeveVital.hidden, false, 'the sleeve meter appears after acquisition');
  assert.equal(ui.sleeveCharge.style.width, '0%', 'no charge is invented before a sleeve resource exists');
  assert.equal(ui.resume.disabled, true);
  assert.equal(ui.menuResume.textContent, 'BACK');
  assert.equal(ui.statXp.textContent, '12');
  assert.equal(ui.statCash.textContent, '34');
  assert.equal(ui.statPerms.textContent, 'gear');
  assert.equal(feedLines[0].textContent, 'first');
  assert.equal(feedLines[1].className, 'feed-line bad');
  assert.equal(feedLines[2].hidden, true);
  assert.ok(ui.radarSensei.style.transform.includes('-26.66'), ui.radarSensei.style.transform);
  assert.ok(ui.radarQuest.style.transform.includes('-26.66'), ui.radarQuest.style.transform);
  assert.equal(ui.quest.hidden, false);
  assert.equal(ui.questTitle.textContent, 'Scout the Enemy Outpost');
  assert.equal(ui.questProgress.textContent, 'Outpost not reached');
  assert.equal(ui.questDistance.textContent, '5m');
  assert.equal(ui.mapPlayers[0].style.left, '50%');
  assert.equal(ui.mapSenseis[0].style.top, '27.5%', 'negative z (toward the north gate) is up-screen');
  assert.equal(ui.mapQuests[0].style.top, '27.5%');
  assert.equal(ui.mapQuests[0].hidden, false);
  assert.equal(ui.menuTabs[0].classList.contains('active'), true);
  assert.equal(ui.menuTabs[1].classList.contains('active'), false);
  assert.equal(ui.menuPages.status.hidden, false);
  assert.equal(ui.menuPages.system.hidden, true);
});
