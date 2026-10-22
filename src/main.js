// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (settlement/character visual pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (performance readout)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated crouch feedback)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// Entry point: scene creation, settings/menu chrome and browser input live in separate modules.
import { createWorld } from './world.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { loadSettings, saveSettings } from './settings.js';
import { BINDING_ACTIONS, ACTION_LABELS, loadBindings, saveBindings, rebind } from './bindings.js';
import { loadSave } from './save.js';

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
  pause: $('#pause'), settings: $('#settings'), loading: $('#loading'),
  hud: $('#hud'), title: $('#title'), resume: $('#resume'),
  feedLines: $$('#feed .feed-line'), radarSensei: $('#radar-sensei'), radarEnemies: $$('.radar-dot.raider'),
  mapScreen: $('#map-screen'), mapPlayers: $$('.mapdot.player'), mapSenseis: $$('.mapdot.sensei'),
  mapEnemies: $$('.mapdot.raider'),
  menuPages: {
    status: $('[data-page="status"]'), gear: $('[data-page="gear"]'),
    skills: $('[data-page="skills"]'), map: $('[data-page="map"]'),
    controls: $('[data-page="controls"]'), system: $('[data-page="system"]')
  },
  menuTabs: $$('#menu-tabs [data-tab]'), menuResume: $('#menu-resume'),
  statXp: $('#stat-xp'), statCash: $('#stat-cash'), statTutorial: $('#stat-tutorial'),
  statPerms: $('#stat-perms'), statScore: $('#stat-score'), saveStatus: $('#save-status')
});
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

$('#start')?.addEventListener('click', () => game.startNew());
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
      attackProgress: game.playerCombat.attackProgress
    });
    world.render(dt);
    sampleFrames += 1;
    sampleTime += elapsed;
    if (sampleTime >= 0.5) {
      if (fpsLabel) {
        const info = world.renderer.info.render;
        fpsLabel.textContent = `${Math.round(sampleFrames / sampleTime)} FPS · ${info.calls} DC · ${Math.round(info.triangles / 1000)}K TRI`;
      }
      sampleFrames = 0;
      sampleTime = 0;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
