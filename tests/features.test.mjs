// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (progression, gear, AI, scan and multiplayer tests)
// Focused headless checks for the systems added after the spar prototype: levels, inventory,
// passive skills, raider vision/defence, Cipher scanning, north-up radar and the transport-agnostic
// multiplayer client. No renderer or DOM is used here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  MAX_LEVEL, Progression, mitigatedDamage, mergeStats, statsForLevel, xpForNext
} from '../src/progression.js';
import { itemById, itemStatLine, rarityOf, ITEM_DEFINITIONS } from '../src/items.js';
import { Inventory, createStarterInventory, starterInventorySnapshot } from '../src/inventory.js';
import { SkillTree, SKILL_TREE } from '../src/skills.js';
import { ALERT, RaiderAI, inVisionCone } from '../src/enemy.js';
import { scanEnemy } from '../src/scan.js';
import { birdseyeOffset } from '../src/radar.js';
import { FighterState } from '../src/fighter.js';
import { QUEST_DEFINITIONS, resolveQuestTarget } from '../src/quests.js';
import { sanitizeSave, emptySave, writeSave, loadSave } from '../src/save.js';
import {
  MP_LIMITS, MP_STATUS, MultiplayerClient, createMultiplayerClient
} from '../src/multiplayer.js';

test('progression follows a rising XP curve and clamps at max level', () => {
  assert.equal(xpForNext(1), 80);
  assert.equal(xpForNext(2), 98);
  assert.equal(xpForNext(MAX_LEVEL), xpForNext(MAX_LEVEL));

  const progression = new Progression();
  assert.equal(progression.level, 1);
  assert.equal(progression.addXp(79), 0);
  assert.equal(progression.xp, 79);
  assert.equal(progression.addXp(1), 1);
  assert.equal(progression.level, 2);
  assert.equal(progression.xp, 0);

  progression.addXp(1_000_000);
  assert.equal(progression.level, MAX_LEVEL);
  assert.equal(progression.xp, 0);
  assert.equal(progression.xpToNext, 0);
  assert.equal(progression.isMaxLevel, true);
  assert.equal(progression.xpRatio, 1);

  const restored = new Progression({ level: 99, xp: 999999, cash: 12 });
  assert.equal(restored.level, MAX_LEVEL);
  assert.equal(restored.xp, 0);
  assert.equal(restored.cash, 12);
});

test('progression cash never goes negative and spend respects the ledger', () => {
  const progression = new Progression();
  assert.equal(progression.addCash(-50), 0);
  assert.equal(progression.cash, 0);
  assert.equal(progression.spendCash(10), false);
  progression.addCash(30);
  assert.equal(progression.spendCash(10), true);
  assert.equal(progression.cash, 20);
});

test('level stats and mitigation are pure and additive', () => {
  assert.deepEqual(statsForLevel(1), { maxHp: 100, maxStamina: 100, attack: 0, defense: 0, speed: 0 });
  const level3 = statsForLevel(3);
  assert.equal(level3.maxHp, 116);
  assert.equal(level3.attack, 3);
  assert.equal(level3.defense, 2.5);

  const merged = mergeStats(level3, { attack: 4 }, { defense: 1, maxHp: 8, speed: .06 });
  assert.deepEqual(merged, { maxHp: 124, maxStamina: 108, attack: 7, defense: 3.5, speed: .06 });
  assert.equal(mitigatedDamage(10, 0), 10);
  assert.ok(mitigatedDamage(10, 100) < 6);
  assert.equal(mitigatedDamage(10, -20), 10, 'negative defence is ignored');
});

test('items expose rarity, values and readable stat lines', () => {
  const katana = itemById('field-katana');
  assert.equal(katana.slot, 'weapon');
  assert.equal(katana.kind, 'katana');
  assert.equal(rarityOf(katana).label, 'RARE');
  assert.ok(katana.value > 0);
  assert.match(itemStatLine(katana), /ATK \+7/);
  assert.match(itemStatLine(katana), /SPD \+2%/);
  assert.equal(itemById('missing'), null);
  assert.ok(ITEM_DEFINITIONS.every(item => item.id && item.name && item.slot && item.rarity));
});

test('starter inventory equips real bonuses and weapon stats follow the active kind', () => {
  const inventory = createStarterInventory();
  assert.equal(inventory.size, 3);
  assert.equal(inventory.equipped.weapon, 'training-staff');
  assert.equal(inventory.equipped.armor, 'patched-vest');
  assert.equal(inventory.equipped.gear, 'field-wrap');

  const staff = inventory.bonuses('staff');
  assert.equal(staff.attack, 2);
  assert.equal(staff.defense, 3);
  assert.equal(staff.maxHp, 8);

  const katana = inventory.bonuses('katana');
  assert.equal(katana.attack, 0, 'the training staff does not boost a katana loadout');
  assert.equal(katana.defense, 3);

  inventory.add('field-katana');
  assert.equal(inventory.equip('field-katana'), true);
  assert.equal(inventory.equipped.weapon, 'field-katana');
  assert.equal(inventory.bonuses('katana').attack, 7);
  assert.equal(inventory.unequip('armor'), true);
  assert.equal(inventory.bonuses('katana').defense, 0);
  assert.equal(inventory.remove('field-katana'), true);
  assert.equal(inventory.equipped.weapon, '', 'removing an item also clears its slot');
});

test('inventory restore rejects duplicates, unknown items and wrong slot types', () => {
  const inventory = new Inventory({
    items: ['training-staff', 'training-staff', 'field-katana', 'patched-vest', 'nope', 7],
    equipped: { weapon: 'patched-vest', armor: 'patched-vest', gear: 'field-wrap' }
  });
  assert.deepEqual(inventory.items, ['training-staff', 'field-katana', 'patched-vest']);
  assert.equal(inventory.equipped.weapon, '', 'armour cannot be equipped as a weapon');
  assert.equal(inventory.equipped.armor, 'patched-vest');
  assert.equal(inventory.equipped.gear, '');
  assert.deepEqual(starterInventorySnapshot().items.length, 3);
});

test('skill tree starts with one point, enforces prerequisites and merges bonuses', () => {
  const skills = new SkillTree();
  assert.equal(skills.points, 1);
  assert.equal(skills.unlock('counter-step').ok, false, 'a prerequisite is required');
  assert.equal(skills.unlock('footwork').ok, true);
  assert.equal(skills.points, 0);
  assert.equal(skills.unlock('footwork').ok, false, 'no points left');
  skills.addPoints(3);
  assert.equal(skills.unlock('footwork').ok, true);
  assert.equal(skills.unlock('counter-step').ok, true);
  assert.equal(skills.unlock('iron-guard').ok, true);
  assert.deepEqual(skills.bonuses(), { attack: 0, defense: 3, speed: .13, maxHp: 0, maxStamina: 0 });
  assert.equal(skills.view().find(node => node.id === 'weak-point').locked, true);

  const restored = new SkillTree({ points: 0, ranks: { footwork: 2, 'counter-step': 1 } });
  assert.equal(restored.points, 0);
  assert.equal(restored.bonuses().speed, .13);
  assert.deepEqual(new SkillTree().snapshot(), { points: 1, ranks: {} });
  assert.ok(SKILL_TREE.every(node => node.id && node.name && node.maxRank > 0));
});

test('raider vision is cone-based and close awareness ignores facing', () => {
  const enemy = { x: 0, z: 0 };
  assert.equal(inVisionCone(enemy, 0, { x: 0, z: 5 }), true, 'facing +Z sees a target to the south');
  assert.equal(inVisionCone(enemy, 0, { x: 0, z: -5 }), false, 'the same target behind is not seen');
  assert.equal(inVisionCone(enemy, Math.PI, { x: 0, z: -5 }), true);
  assert.equal(inVisionCone(enemy, Math.PI / 2, { x: 20, z: 0 }, { range: 10 }), false);
  assert.equal(inVisionCone(enemy, Math.PI / 2, { x: 1, z: 0 }, { range: 10 }), true, 'short range is alert regardless of cone');
});

test('raider alert moves calm → suspicious → spotted and then attacks', () => {
  const ai = new RaiderAI({ reach: 2, windup: .2, accuracy: 1, visionRange: 20 });
  const frame = 1 / 60;
  for (let i = 0; i < 30; i++) ai.update(frame, { distance: 8, playerVisible: true, playerInCone: true, random: () => 0 });
  assert.equal(ai.alert, ALERT.SUSPICIOUS);
  assert.equal(ai.marker, '?');
  for (let i = 0; i < 60; i++) ai.update(frame, { distance: 8, playerVisible: true, playerInCone: true, random: () => 0 });
  assert.equal(ai.alert, ALERT.SPOTTED);
  assert.equal(ai.marker, '!');

  ai.state = 'idle';
  ai.attackCooldown = 0;
  let struck = false;
  for (let i = 0; i < 40; i++) {
    struck = struck || ai.update(frame, { distance: 1, playerVisible: true, playerInCone: true, random: () => 0 }).strike;
  }
  assert.equal(struck, true);
  assert.equal(ai.state, 'recover');
});

test('raider defensive reactions are deterministic with an injected random source', () => {
  const make = () => {
    const ai = new RaiderAI();
    ai.alert = ALERT.SPOTTED;
    return ai;
  };
  assert.equal(make().reactToAttack(1, { random: () => .05 }), 'parry');
  assert.equal(make().reactToAttack(1, { random: () => .2 }), 'dodge');
  assert.equal(make().reactToAttack(1, { random: () => .5 }), 'block');
  assert.equal(make().reactToAttack(1, { random: () => .95 }), 'none');

  const calm = new RaiderAI();
  assert.equal(calm.reactToAttack(1, { random: () => 0 }), 'none');
  const far = make();
  assert.equal(far.reactToAttack(99, { random: () => 0 }), 'none');
  far.stagger();
  assert.equal(far.reactToAttack(1, { random: () => 0 }), 'none');
});

test('Cipher scan reports vitals, capabilities, weaknesses and cache state', () => {
  const state = new FighterState({ maxHp: 50 });
  state.hp = 30;
  const enemy = {
    id: 'raider-1', name: 'RAIDER · BLADE', level: 3, weapon: 'katana',
    state, ai: { alert: ALERT.SPOTTED },
    abilities: ['QUICK SLASH', 'GUARD'],
    weaknesses: ['Short recovery after the slash.']
  };
  const live = scanEnemy(enemy);
  assert.equal(live.name, 'RAIDER · BLADE');
  assert.equal(live.level, 3);
  assert.equal(live.hp, 30);
  assert.equal(live.maxHp, 50);
  assert.equal(live.healthPercent, 60);
  assert.equal(live.state, 'HOSTILE');
  assert.deepEqual(live.abilities, ['QUICK SLASH', 'GUARD']);
  assert.deepEqual(live.weaknesses, ['Short recovery after the slash.']);
  assert.equal(live.confidence, 'LIVE');

  enemy.scannedBefore = true;
  assert.equal(scanEnemy(enemy).confidence, 'CACHED');
  assert.equal(scanEnemy(null), null);

  const fallback = scanEnemy({ state: new FighterState(), ai: {}, weapon: 'staff' });
  assert.ok(fallback.abilities.includes('STAFF SWEEP'));
  assert.ok(fallback.weaknesses.length > 0);
});

test('birdseye minimap is north-up and independent of player facing', () => {
  const player = { x: 10, z: -20 };
  const north = birdseyeOffset(player, { x: 10, z: -30 }, 20, 40);
  assert.equal(north.x, 0);
  assert.equal(north.y, -20);
  const east = birdseyeOffset(player, { x: 20, z: -20 }, 20, 40);
  assert.equal(east.x, 20);
  assert.equal(east.y, 0);

  const far = birdseyeOffset(player, { x: 10, z: 100 }, 20, 40);
  assert.equal(far.clamped, true);
  assert.ok(Math.hypot(far.x, far.y) <= 40.001);
});

test('tower quests point across zones and save tower state round-trips', () => {
  const enter = QUEST_DEFINITIONS.find(quest => quest.id === 'enter-first-tower');
  const link = QUEST_DEFINITIONS.find(quest => quest.id === 'first-link');
  assert.equal(enter.targetZone, 'wilds');
  assert.equal(link.targetZone, 'tower');
  assert.equal(link.rewardCash > 0, true);
  assert.deepEqual(
    resolveQuestTarget(enter, { zone: 'training', gate: { x: 0, z: -10.6 } }),
    { x: 0, z: -10.6 }
  );
  assert.deepEqual(
    resolveQuestTarget(link, { zone: 'wilds', gate: { x: 0, z: -76 } }),
    { x: 0, z: -76 }
  );

  const sanitized = sanitizeSave({ tower: { entered: true, linked: true } });
  assert.deepEqual(sanitized.tower, { entered: true, linked: true });
  const store = new Map();
  const storage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value)
  };
  writeSave(storage, { ...sanitized, tower: { entered: true, linked: false } });
  assert.deepEqual(loadSave(storage)?.tower, { entered: true, linked: false });
  assert.deepEqual(emptySave().tower, { entered: false, linked: false });
});

test('multiplayer client is transport-agnostic and keeps party/chat bounded', () => {
  const client = createMultiplayerClient({ id: 'local-1', name: ' Rook ' });
  assert.equal(client.local.name, 'Rook');
  assert.equal(client.status, MP_STATUS.OFFLINE);
  assert.equal(client.joinLobby({ id: 'lobby-1' }), false, 'must connect first');

  assert.equal(client.requestConnect(), true);
  assert.equal(client.status, MP_STATUS.CONNECTING);
  const hello = client.drainOutbox();
  assert.equal(hello.length, 1);
  assert.equal(hello[0].type, 'hello');

  client.markConnected();
  assert.equal(client.joinLobby({ id: 'lobby-1', name: 'Test Lobby' }), true);
  assert.equal(client.members.size, 1);
  assert.equal(client.addMember({ id: 'remote-1', name: 'Ari' }), true);
  assert.equal(client.addMember({ id: 'remote-1', name: 'Ari' }), false);
  assert.equal(client.addMember({ id: 'local-1', name: 'Imposter' }), false);

  assert.equal(client.inviteToParty('remote-1'), true);
  assert.equal(client.isLeader, true);
  assert.equal(client.acceptPartyInvite('remote-1'), true);
  assert.equal(client.partySize, 2);
  assert.equal(client.partyMembers().find(member => member.id === 'remote-1').name, 'Ari');
  assert.equal(client.setMemberReady('remote-1', true), true);
  assert.ok(client.partyMembers().find(member => member.id === 'remote-1').ready);

  assert.equal(client.setLocalReady(true), true);
  assert.equal(client.snapshot().party.length, 2);

  const message = client.sendChat('  hello\n  world  ');
  assert.equal(message.text, 'hello world');
  assert.equal(client.chat.length, 1);
  const outbox = client.drainOutbox();
  assert.equal(outbox.at(-1).type, 'chat');
  assert.equal(client.receiveChat({ from: 'remote-1', text: '  hi\u0000 there ' }).text, 'hi there');
  for (let i = 0; i < MP_LIMITS.chatHistory + 10; i++) client.addSystemMessage(`line ${i}`);
  assert.equal(client.chat.length, MP_LIMITS.chatHistory);
  assert.equal(client.sendChat(''), null);

  const snapshot = client.snapshot();
  assert.equal(snapshot.status, MP_STATUS.ONLINE);
  assert.equal(snapshot.local.name, 'Rook');
  assert.ok(JSON.stringify(snapshot).length > 0, 'snapshot is serializable');
  assert.equal(client.leaveParty(), true);
  assert.equal(client.partySize, 0);
  client.markDisconnected('closed');
  assert.equal(client.status, MP_STATUS.OFFLINE);
  assert.equal(client.lobby, null);
  assert.equal(client.chat.length, 0);
  assert.equal(client.lastError, 'closed');
});

test('multiplayer stays out of story mode until a mode explicitly wires it', async () => {
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const game = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  const shell = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(/from\s+['"]\.\/multiplayer\.js['"]/.test(main), false);
  assert.equal(/from\s+['"]\.\/multiplayer\.js['"]/.test(game), false);
  assert.match(shell, /id="multiplayer"[^>]*disabled/, 'the story-shell button remains a disabled placeholder');
  assert.ok(new MultiplayerClient().status === MP_STATUS.OFFLINE);
});
