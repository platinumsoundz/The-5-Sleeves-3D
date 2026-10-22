// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (performance readout)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated crouch feedback)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (quests/minimap pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (solid scenery, enemy outpost, story introduction)
// Entry point: scene creation, settings/menu chrome and browser input live in separate modules.
import { createWorld } from './world.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { loadSettings, saveSettings } from './settings.js';
import { BINDING_ACTIONS, ACTION_LABELS, loadBindings, saveBindings, rebind } from './bindings.js';
import { loadSave } from './save.js';
import { WORLD_MAP, projectMapBounds, projectMapPoint } from './worldmap.js';
import { StoryDeck, TOWER_STORY_PAGES } from './story.js';
import { itemById, itemStatLine, rarityOf } from './items.js';

const $ = query => document.querySelector(query);
const $$ = query => [...document.querySelectorAll(query)];

const world = createWorld($('#game'));
const input = new Input();
const game = new Game(world, input, {
  prompt: $('#prompt'), message: $('#message'),
  phase: $('#phase'), score: $('#score'), targetName: $('#target-name'), weapon: $('#weapon'),
  playerHealth: $('#player-health'),
  playerStamina: $('#player-stamina'), sleeveVital: $('#sleeve-vital'), sleeveCharge: $('#sleeve-charge'),
  senseiHealth: $('#sensei-health'), result: $('#result'),
  skip: $('#skip'), restart: $('#restart'), device: $('#device'),
  warning: $('#warning'), touchControls: $('#touch-controls'),
  fire: $('#fire'), reticle: $('#reticle'),
  targetAlert: $('#target-alert'),
  pause: $('#pause'), settings: $('#settings'), loading: $('#loading'),
  hud: $('#hud'), title: $('#title'), resume: $('#resume'),
  feedLines: $$('#feed .feed-line'), radarSensei: $('#radar-sensei'), radarEnemies: $$('.radar-dot.raider'),
  radarQuest: $('#radar-quest'), radarPlayer: $('#radar-player'), radarNorth: $('.radar-north'),
  quest: $('#quest'), questTitle: $('#quest-title'), questProgress: $('#quest-progress'),
  questDistance: $('#quest-distance'),
  scan: $('#scan'), scanName: $('#scan-name'), scanLevel: $('#scan-level'),
  scanState: $('#scan-state'), scanHp: $('#scan-hp'), scanHealth: $('#scan-health-fill'),
  scanAbilities: $('#scan-abilities'), scanWeaknesses: $('#scan-weaknesses'),
  scanNote: $('#scan-note'), scanConfidence: $('#scan-confidence'),
  mapScreen: $('#map-screen'), mapPlayers: $$('.mapdot.player'), mapSenseis: $$('.mapdot.sensei'),
  mapEnemies: $$('.mapdot.raider'), mapQuests: $$('.mapdot.quest'),
  menuPages: {
    status: $('[data-page="status"]'), gear: $('[data-page="gear"]'),
    skills: $('[data-page="skills"]'), quests: $('[data-page="quests"]'), map: $('[data-page="map"]'),
    controls: $('[data-page="controls"]'), system: $('[data-page="system"]')
  },
  menuTabs: $$('#menu-tabs [data-tab]'), menuResume: $('#menu-resume'),
  statLevel: $('#stat-level'), statXp: $('#stat-xp'), statXpNext: $('#stat-xp-next'),
  xpFill: $('#xp-fill'), statCash: $('#stat-cash'), statSkillPoints: $('#stat-skill-points'),
  statAttack: $('#stat-attack'), statDefense: $('#stat-defense'), statSpeed: $('#stat-speed'),
  statTower: $('#stat-tower'), statTutorial: $('#stat-tutorial'),
  statPerms: $('#stat-perms'), statScore: $('#stat-score'), saveStatus: $('#save-status')
}, { requestStart: () => openStory() });
window.__trainingReady = true;

// Settings: stored locally, applied to the camera, renderer and touch layout.
let settings = loadSettings(window.localStorage);
const sensitivity = $('#sensitivity');
const invert = $('#invert');
const quality = $('#quality');
const touchScale = $('#touch-scale');
const touchOpacity = $('#touch-opacity');
const touchLeft = $('#touch-left');
const touchScaleValue = $('#touch-scale-value');
const touchOpacityValue = $('#touch-opacity-value');
const touchControls = $('#touch-controls');

function applySettings() {
  world.setSettings(settings);
  world.setQuality(settings.quality);
  if (sensitivity) sensitivity.value = settings.sensitivity;
  if (invert) invert.checked = settings.invertY;
  if (quality) quality.value = settings.quality;
  if (touchScale) touchScale.value = settings.touchScale;
  if (touchOpacity) touchOpacity.value = settings.touchOpacity;
  if (touchLeft) touchLeft.checked = settings.leftHanded;
  if (touchScaleValue) touchScaleValue.textContent = `${Math.round(settings.touchScale * 100)}%`;
  if (touchOpacityValue) touchOpacityValue.textContent = `${Math.round(settings.touchOpacity * 100)}%`;
  if (touchControls) {
    touchControls.style.setProperty('--pad-scale', settings.touchScale);
    touchControls.style.setProperty('--pad-opacity', settings.touchOpacity);
    touchControls.classList.toggle('lefty', settings.leftHanded);
  }
}

function persist(next) {
  settings = saveSettings(window.localStorage, next);
  applySettings();
}

sensitivity?.addEventListener('input', () => persist({ ...settings, sensitivity: Number(sensitivity.value) }));
invert?.addEventListener('change', () => persist({ ...settings, invertY: invert.checked }));
quality?.addEventListener('change', () => persist({ ...settings, quality: quality.value }));
touchScale?.addEventListener('input', () => persist({ ...settings, touchScale: Number(touchScale.value) }));
touchOpacity?.addEventListener('input', () => persist({ ...settings, touchOpacity: Number(touchOpacity.value) }));
touchLeft?.addEventListener('change', () => persist({ ...settings, leftHanded: touchLeft.checked }));
applySettings();

// Bindings and the title/menu shell.
let bindings = loadBindings(window.localStorage);
input.setBindings(bindings);
let savedGame = loadSave(window.localStorage);
game.setSaveInfo(savedGame);
game.showTitle();

// PWA: installability is handled by the manifest + service worker. Android/Chromium also
// exposes a deferred install prompt; iOS uses Share → Add to Home Screen instead.
const installButton = $('#install');
const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches === true
  || window.navigator.standalone === true;
document.documentElement.classList.toggle('pwa-standalone', standalone);
let installPrompt = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = standalone;
});
installButton?.addEventListener('click', async () => {
  if (!installPrompt) return;
  try {
    await installPrompt.prompt();
    await installPrompt.userChoice;
  } catch {
    // The browser can discard a deferred prompt; the menu/install hint remains available.
  }
  installPrompt = null;
  installButton.hidden = true;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  if (installButton) installButton.hidden = true;
});
if ('serviceWorker' in navigator
  && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).catch(() => {});
  });
}

// Build the large-map overlays from the same data catalogue the HUD projects markers with.
// Adding a region or point of interest to WORLD_MAP is enough for it to appear on every map.
function buildWorldMapOverlay(host) {
  const regionLayer = host.querySelector('.map-regions');
  const poiLayer = host.querySelector('.map-pois');
  if (!regionLayer || !poiLayer || regionLayer.childElementCount) return;
  for (const region of WORLD_MAP.regions) {
    const frame = projectMapBounds(region.bounds);
    const node = document.createElement('div');
    node.className = `map-region ${region.kind || ''}`;
    node.style.left = `${frame.left}%`;
    node.style.top = `${frame.top}%`;
    node.style.width = `${frame.width}%`;
    node.style.height = `${frame.height}%`;
    const label = document.createElement('span');
    label.textContent = region.label;
    node.append(label);
    regionLayer.append(node);
  }
  for (const point of WORLD_MAP.points) {
    const spot = projectMapPoint(point);
    const node = document.createElement('div');
    node.className = `map-poi ${point.kind || ''}`;
    node.style.left = `${spot.left}%`;
    node.style.top = `${spot.top}%`;
    const label = document.createElement('span');
    label.textContent = point.label;
    node.append(label);
    poiLayer.append(node);
  }
}
for (const map of $$('.map-square')) buildWorldMapOverlay(map);

let questVersion = -1;
function renderQuestList() {
  const host = $('#quest-list');
  if (!host) return;
  host.replaceChildren();
  for (const quest of game.questEntries) {
    const card = document.createElement('article');
    card.className = `quest-card ${quest.status}`;
    card.setAttribute('role', 'listitem');
    const copy = document.createElement('div');
    copy.className = 'quest-copy';
    const title = document.createElement('h4');
    title.textContent = quest.title;
    const summary = document.createElement('p');
    summary.textContent = quest.summary;
    const meta = document.createElement('div');
    meta.className = 'quest-meta';
    const objective = document.createElement('span');
    objective.textContent = quest.objective;
    const progress = document.createElement('span');
    progress.className = 'quest-progress';
    progress.textContent = quest.progressLabel;
    const reward = document.createElement('span');
    reward.className = 'quest-reward';
    reward.textContent = `+${quest.rewardXp} XP`;
    meta.append(objective, progress, reward);
    copy.append(title, summary, meta);
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'quest-action';
    action.dataset.questAction = quest.id;
    action.textContent = quest.status === 'active' ? 'TRACKED'
      : quest.status === 'completed' ? 'COMPLETE' : 'TRACK';
    action.disabled = quest.status !== 'available';
    card.append(copy, action);
    host.append(card);
  }
  questVersion = game.questVersion;
}

function syncQuestList() {
  if (questVersion !== game.questVersion) renderQuestList();
}

$('#quest-list')?.addEventListener('click', event => {
  const button = event.target.closest?.('[data-quest-action]');
  if (!button) return;
  if (game.selectQuest(button.dataset.questAction)) renderQuestList();
});

renderQuestList();

// Inventory, equipment and skill-tree views are rebuilt only when the game bumps its
// progression version, so the menu does not churn DOM every frame.
let progressionVersion = -1;
function itemCard(item, { equipped = false, action = 'equip' } = {}) {
  const card = document.createElement('article');
  card.className = `item-card rarity-${item.rarity}${equipped ? ' equipped' : ''}`;
  card.setAttribute('role', 'listitem');
  const top = document.createElement('div');
  top.className = 'item-top';
  const name = document.createElement('b');
  name.textContent = item.name;
  const rarity = document.createElement('span');
  rarity.className = 'item-rarity';
  rarity.textContent = rarityOf(item).label;
  top.append(name, rarity);
  const stats = document.createElement('p');
  stats.className = 'item-stats';
  const levelReq = item.levelReq || 1;
  stats.textContent = `${itemStatLine(item) || 'No stat bonus'} · LV ${levelReq}`;
  const desc = document.createElement('p');
  desc.className = 'item-desc';
  desc.textContent = item.description;
  const locked = levelReq > game.progression.level;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'item-action';
  button.dataset.itemAction = action;
  button.dataset.itemId = item.id;
  button.textContent = action === 'unequip' ? 'UNEQUIP'
    : locked ? `LEVEL ${levelReq}` : equipped ? 'EQUIPPED' : 'EQUIP';
  button.disabled = action !== 'unequip' && (equipped || locked);
  card.append(top, stats, desc, button);
  return card;
}

function renderInventory() {
  const inventory = game.inventory;
  const equippedHost = $('#equipped-list');
  const listHost = $('#inventory-list');
  const count = $('#inventory-count');
  const statHost = $('#inventory-stats');
  if (count) count.textContent = `${inventory.size} / 24`;
  if (statHost) {
    const stats = game.playerStats;
    statHost.textContent = `ACTIVE BONUSES · ATK +${Math.round(stats.attack * 10) / 10} · DEF +${Math.round(stats.defense * 10) / 10} · SPD ${Math.round(stats.speed * 100)}% · HP ${Math.round(stats.maxHp)}`;
  }
  if (equippedHost) {
    equippedHost.replaceChildren();
    for (const slot of ['weapon', 'armor', 'gear']) {
      const item = itemById(inventory.equipped[slot]);
      const row = document.createElement('div');
      row.className = 'gear-slot';
      const label = document.createElement('span');
      label.textContent = slot.toUpperCase();
      const name = document.createElement('b');
      name.textContent = item ? item.name : 'EMPTY';
      const note = document.createElement('em');
      note.textContent = item ? itemStatLine(item) : 'Nothing equipped in this slot.';
      row.append(label, name, note);
      if (item) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gear-remove';
        button.dataset.itemAction = 'unequip';
        button.dataset.itemId = item.id;
        button.dataset.slot = slot;
        button.textContent = 'REMOVE';
        row.append(button);
      }
      equippedHost.append(row);
    }
  }
  if (listHost) {
    listHost.replaceChildren();
    for (const item of inventory.entries()) {
      const equipped = ['weapon', 'armor', 'gear'].some(slot => inventory.equipped[slot] === item.id);
      listHost.append(itemCard(item, { equipped, action: equipped ? 'unequip' : 'equip' }));
    }
  }
}

function renderSkills() {
  const host = $('#skill-list');
  const points = $('#skill-points');
  if (points) points.textContent = String(game.skills.points);
  if (!host) return;
  host.replaceChildren();
  for (const node of game.skills.view()) {
    const card = document.createElement('article');
    card.className = `skill-card${node.locked ? ' locked' : ''}${node.rank >= node.maxRank ? ' mastered' : ''}`;
    card.setAttribute('role', 'listitem');
    const top = document.createElement('div');
    top.className = 'skill-top';
    const branch = document.createElement('span');
    branch.textContent = node.branch;
    const rank = document.createElement('b');
    rank.textContent = `${node.rank} / ${node.maxRank}`;
    top.append(branch, rank);
    const name = document.createElement('h4');
    name.textContent = node.name;
    const desc = document.createElement('p');
    desc.textContent = node.description;
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'skill-action';
    action.dataset.skillId = node.id;
    action.textContent = node.rank >= node.maxRank ? 'MASTERED'
      : node.canUnlock ? `LEARN · ${node.cost} PT` : node.reason || 'LOCKED';
    action.disabled = !node.canUnlock;
    card.append(top, name, desc, action);
    host.append(card);
  }
}

function renderProgressionUI() {
  if (progressionVersion === game.progressionVersion) return;
  progressionVersion = game.progressionVersion;
  renderInventory();
  renderSkills();
}

$('#inventory-list')?.addEventListener('click', event => {
  const button = event.target.closest?.('[data-item-action]');
  if (!button) return;
  if (button.dataset.itemAction === 'unequip') {
    const item = itemById(button.dataset.itemId);
    if (item) game.unequipSlot(item.slot);
  } else {
    game.equipItem(button.dataset.itemId);
  }
  renderProgressionUI();
});
$('#equipped-list')?.addEventListener('click', event => {
  const button = event.target.closest?.('[data-item-action="unequip"]');
  if (!button) return;
  game.unequipSlot(button.dataset.slot);
  renderProgressionUI();
});
$('#skill-list')?.addEventListener('click', event => {
  const button = event.target.closest?.('[data-skill-id]');
  if (!button) return;
  game.unlockSkill(button.dataset.skillId);
  renderProgressionUI();
});

// Story introduction. Start/Enter opens the deck, Next advances, and the final page's button
// exits into a new run. The deck is data-driven so later story/dialogue events can reuse it.
const story = $('#story');
const titleScreen = $('#title');
let storyDeck = new StoryDeck();
let storyKickerText = 'A NONLETHAL BEGINNING';
const storyTitle = $('#story-title');
const storyKicker = $('#story-kicker');
const storyBody = $('#story-body');
const storyPageCount = $('#story-page-count');
const storyNext = $('#story-next');
const storySkip = $('#story-skip');
const storyConfirm = $('#story-confirm');
const storyConfirmSkip = $('#story-confirm-skip');
const storyConfirmCancel = $('#story-confirm-cancel');
let storyOpen = false;
let storyAfter = null;

function renderStory() {
  const page = storyDeck.page;
  if (!page) return;
  storyKicker.textContent = storyKickerText;
  storyTitle.textContent = page.title;
  storyBody.replaceChildren(...page.body.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  }));
  storyPageCount.textContent = `${String(storyDeck.index + 1).padStart(2, '0')} / ${String(storyDeck.count).padStart(2, '0')}`;
  storyNext.textContent = storyDeck.isLast ? 'EXIT' : 'NEXT';
  storyConfirm.hidden = true;
}

function openStory(after = () => game.startNew(), pages = null, kicker = 'A NONLETHAL BEGINNING') {
  if (storyOpen) return;
  storyOpen = true;
  storyAfter = after;
  storyDeck = new StoryDeck(pages || undefined);
  storyKickerText = kicker;
  storyDeck.reset();
  // Hud.sync owns the title's hidden state, so hide it visually as well while story is open.
  titleScreen.style.visibility = 'hidden';
  story.hidden = false;
  renderStory();
  storyNext.focus();
}

function closeStory(startGame = true) {
  if (!storyOpen) return;
  storyOpen = false;
  story.hidden = true;
  storyConfirm.hidden = true;
  titleScreen.style.visibility = '';
  const after = storyAfter;
  storyAfter = null;
  if (startGame && after) after();
}

function requestStorySkip() {
  if (!storyOpen) return;
  storyConfirm.hidden = false;
  storyConfirmCancel.focus();
}

function cancelStorySkip() {
  storyConfirm.hidden = true;
  storyNext.focus();
}

storyNext?.addEventListener('click', () => {
  if (storyDeck.next()) renderStory();
  else closeStory(true);
});
storySkip?.addEventListener('click', requestStorySkip);
storyConfirmSkip?.addEventListener('click', () => closeStory(true));
storyConfirmCancel?.addEventListener('click', cancelStorySkip);
window.addEventListener('keydown', event => {
  if (!storyOpen || event.code !== 'Escape') return;
  event.preventDefault();
  if (storyConfirm.hidden) requestStorySkip();
  else cancelStorySkip();
});

game.events.on('tower-link', () => {
  game.paused = true;
  openStory(() => {
    game.paused = false;
    game.paint();
  }, TOWER_STORY_PAGES, 'THE FIRST TOWER');
});

$('#start')?.addEventListener('click', () => openStory());
$('#resume')?.addEventListener('click', () => {
  if (savedGame) game.resume(savedGame);
});
$('#title-settings')?.addEventListener('click', () => game.openMenu('controls'));
$('#menu-tabs')?.addEventListener('click', event => {
  const tab = event.target.closest('[data-tab]');
  if (tab) game.setMenuTab(tab.dataset.tab);
});
$('#open-map')?.addEventListener('click', () => game.openMap());
$('#map-close')?.addEventListener('click', () => game.closeMap());
const radar = $('#radar');
radar?.addEventListener('click', () => game.openMap());
radar?.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    game.openMap();
  }
});
$('#save-game')?.addEventListener('click', () => {
  savedGame = game.saveGame(window.localStorage);
});
$('#delete-save')?.addEventListener('click', () => {
  game.clearSave(window.localStorage);
  savedGame = null;
});

function setDevResult(text) {
  const node = $('#devresult');
  if (node) node.textContent = text;
}

function applyDevCode() {
  const field = $('#devcode');
  if (!field) return;
  const result = game.redeemDev(field.value);
  setDevResult(result.message);
  if (result.ok) field.value = '';
  savedGame = game.saveInfo;
}
$('#devapply')?.addEventListener('click', applyDevCode);
$('#devcode')?.addEventListener('keydown', event => {
  if (event.key === 'Enter') { event.preventDefault(); applyDevCode(); }
});

const PAD_LABELS = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'VIEW', 'START', 'L3', 'R3', 'D↑', 'D↓', 'D←', 'D→', 'GUIDE'];

function formatBinding(device, action) {
  const values = bindings[device]?.[action] || [];
  if (device === 'keyboard') {
    if (!values.length && action === 'aim') return 'Mouse 2';
    return values.length ? values.map(code => code.replace(/^Key|^Digit/, '')).join(' / ') : 'Unbound';
  }
  return values.length ? values.map(index => PAD_LABELS[index] || `B${index}`).join(' / ') : 'Unbound';
}

let capture = null;
let padArmedAt = 0;

function buildBindingRows() {
  for (const device of ['keyboard', 'gamepad']) {
    const host = $(device === 'keyboard' ? '#keyboard-binds' : '#gamepad-binds');
    if (!host) continue;
    host.replaceChildren();
    for (const action of BINDING_ACTIONS) {
      const row = document.createElement('div');
      row.className = 'bind-row';
      const label = document.createElement('span');
      label.textContent = ACTION_LABELS[action] || action;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'bind-button';
      button.textContent = formatBinding(device, action);
      button.addEventListener('click', () => beginCapture(device, action, button));
      row.append(label, button);
      host.append(row);
    }
  }
}

function beginCapture(device, action, button) {
  if (capture) capture.button.textContent = formatBinding(capture.device, capture.action);
  capture = { device, action, button };
  button.textContent = device === 'keyboard' ? 'Press a key…' : 'Press a button…';
  padArmedAt = performance.now() + 150;
}

function cancelCapture() {
  if (!capture) return;
  capture.button.textContent = formatBinding(capture.device, capture.action);
  capture = null;
}

function finishCapture(value) {
  if (!capture) return;
  bindings = rebind(bindings, capture.device, capture.action, value);
  saveBindings(window.localStorage, bindings);
  input.setBindings(bindings);
  input.reset();
  capture = null;
  buildBindingRows();
}

window.addEventListener('keydown', event => {
  if (!capture || capture.device !== 'keyboard') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.code === 'Escape') { cancelCapture(); return; }
  finishCapture(event.code);
}, true);

document.addEventListener('pointerdown', event => {
  if (capture && !event.target.closest?.('.bind-button')) cancelCapture();
}, true);

function pollPadRebind() {
  if (!capture || capture.device !== 'gamepad') return;
  if (performance.now() < padArmedAt) return;
  const pads = navigator.getGamepads?.() || [];
  for (const pad of pads) {
    if (!pad) continue;
    for (let index = 0; index < pad.buttons.length; index++) {
      if (pad.buttons[index]?.pressed) { finishCapture(index); return; }
    }
  }
}

buildBindingRows();

// Presentation subscribes to gameplay events instead of reaching into rules modules.
game.events.on('hit', ({ target }) => world.pulse(target, 0xff6b4a));
game.events.on('parry', () => world.pulse('sensei', 0x7fe6ff));
game.events.on('block', () => world.pulse('player', 0x7fe6ff));
game.events.on('grab', ({ target }) => world.pulse(target, 0xffd27f));
game.events.on('sleeve-pulse', ({ target }) => world.pulse(target, 0x7fe6ff));
game.events.on('weapon-change', ({ weapon }) => {
  if (weapon === 'cipher') world.pulse('player', 0x7fe6ff);
});

const fpsLabel = $('#fps');
let previous = performance.now();
let sampleFrames = 0;
let sampleTime = 0;

function frame(now) {
  const elapsed = Math.max(0, (now - previous) / 1000);
  previous = now;
  const dt = Math.min(elapsed, 0.05);
  if (!document.hidden) {
    pollPadRebind();
    game.update(dt);
    syncQuestList();
    renderProgressionUI();
    const look = input.consumeLook();
    if ((look.x || look.y) && game.screen === 'playing') world.look(look.x, look.y);
    world.setFeedback({
      senseiWindingUp: game.ai.windingUp,
      playerBlocking: game.blocking,
      aiming: game.aiming,
      crouching: game.crouching,
      swing: game.playerCombat.swingAngle,
      weapon: game.weapon,
      attackMove: game.attackMove,
      attackProgress: game.playerCombat.attackProgress,
      enemyAlerts: game.encounters.map(enemy => ({ alert: enemy.ai.alert, marker: enemy.ai.marker }))
    });
    world.render(dt);
    sampleFrames += 1;
    sampleTime += elapsed;
    if (sampleTime >= 1) {
      if (fpsLabel) {
        const info = world.renderer.info.render;
        const fps = Math.round(sampleFrames / sampleTime);
        const draws = info.calls;
        const tris = Math.round(info.triangles / 1000);
        fpsLabel.textContent = `${fps} FPS · ${draws} draws · ${tris}k tris`;
        fpsLabel.title = 'Frames per second · draw calls · triangles rendered in the last second. FPS changes as the scene moves; that is normal.';
      }
      sampleFrames = 0;
      sampleTime = 0;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
