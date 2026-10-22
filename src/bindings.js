// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// Remappable keyboard and controller bindings. Movement sticks stay fixed (left move, right
// look); every button/action here can be rebound. Pure + storage-injected for tests.
export const BINDINGS_KEY = 'five-sleeves.bindings.v1';

export const BINDING_ACTIONS = [
  'forward', 'back', 'left', 'right', 'attack', 'jump', 'guard', 'sprint',
  'aim', 'crouch', 'interact', 'confirm', 'menu', 'map',
  'weaponPrev', 'weaponNext'
];

export const ACTION_LABELS = {
  forward: 'Move forward', back: 'Move back', left: 'Move left', right: 'Move right',
  attack: 'Attack / unarmed combo', jump: 'Jump / get up', guard: 'Guard / dodge / parry',
  sprint: 'Sprint', aim: 'Aim / lock (mouse on PC)', crouch: 'Crouch',
  interact: 'Interact / use', confirm: 'Confirm', menu: 'Menu / pause', map: 'Map',
  weaponPrev: 'Previous weapon', weaponNext: 'Next weapon'
};

export const DEFAULT_KEYBOARD = Object.freeze({
  forward: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  attack: ['KeyJ'], jump: ['Space'], guard: ['KeyQ', 'KeyK'],
  sprint: ['ShiftLeft', 'ShiftRight'], aim: [],
  crouch: ['ControlLeft', 'ControlRight'], interact: ['KeyF'],
  confirm: ['Enter'], menu: ['Escape'], map: ['Tab', 'KeyM'],
  weaponPrev: ['BracketLeft'], weaponNext: ['BracketRight']
});

export const DEFAULT_GAMEPAD = Object.freeze({
  forward: [], back: [], left: [], right: [],
  attack: [7], jump: [0], guard: [1], sprint: [10], aim: [6],
  crouch: [11], interact: [2], confirm: [3], menu: [9], map: [8],
  weaponPrev: [14], weaponNext: [15]
});

const isKey = value => typeof value === 'string' && value.length > 0 && value.length <= 24;
const isButton = value => Number.isInteger(value) && value >= 0 && value <= 17;

function sanitizeDevice(raw, defaults, isValid) {
  const out = {};
  const owners = new Map();

  for (const action of BINDING_ACTIONS) {
    const source = Array.isArray(raw?.[action]) ? raw[action] : defaults[action] || [];
    const list = [];
    for (const value of source) {
      if (!isValid(value) || owners.has(value) || list.includes(value)) continue;
      list.push(value);
      owners.set(value, action);
    }
    out[action] = list;
  }

  // Never leave a core action unbound if a default exists and is still free.
  for (const action of BINDING_ACTIONS) {
    if (out[action].length || !(defaults[action]?.length)) continue;
    for (const value of defaults[action]) {
      if (!isValid(value) || owners.has(value)) continue;
      out[action].push(value);
      owners.set(value, action);
    }
  }
  return out;
}

export function sanitizeBindings(raw = {}) {
  return {
    keyboard: sanitizeDevice(raw?.keyboard, DEFAULT_KEYBOARD, isKey),
    gamepad: sanitizeDevice(raw?.gamepad, DEFAULT_GAMEPAD, isButton)
  };
}

export function loadBindings(storage) {
  try {
    return sanitizeBindings(JSON.parse(storage?.getItem(BINDINGS_KEY) || '{}'));
  } catch {
    return sanitizeBindings();
  }
}

export function saveBindings(storage, bindings) {
  const safe = sanitizeBindings(bindings);
  try {
    storage?.setItem(BINDINGS_KEY, JSON.stringify(safe));
  } catch {
    // Ignore blocked storage.
  }
  return safe;
}

export function rebind(bindings, device, action, value) {
  const next = sanitizeBindings(bindings);
  if (!BINDING_ACTIONS.includes(action) || !(device === 'keyboard' || device === 'gamepad')) {
    return next;
  }
  const previousOwner = BINDING_ACTIONS.find(key => next[device][key].includes(value));
  if (previousOwner && previousOwner !== action) {
    // Swap instead of silently stealing a button; this keeps the old action usable.
    const displaced = next[device][action][0];
    next[device][previousOwner] = displaced === undefined ? [] : [displaced];
  }
  next[device][action] = [value];
  return sanitizeBindings(next);
}
