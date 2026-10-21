// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Normalizes every device into named actions plus an analog move vector, so gameplay never
// checks raw keys, button numbers or touch coordinates.
import { CONFIG } from './config.js';
import { deadzone, joystick } from './controls.js';

export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.padHeld = new Set();
    this.padName = '';
    this.padMove = { x: 0, z: 0 };
    this.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.device = this.hasTouch ? 'touch' : 'keyboard';
    this.lastSource = this.device;
    this.pointerStart = null;
    this.look = { x: 0, y: 0 };
    this.stick = { pointerId: null, x: 0, y: 0, magnitude: 0 };
    this.pointerActions = new Map();

    window.addEventListener('keydown', event => {
      const action = KEYS[event.code];
      if (action) {
        event.preventDefault();
        this.device = 'keyboard';
        this.down(action);
      }
    });
    window.addEventListener('keyup', event => {
      const action = KEYS[event.code];
      if (action) this.up(action);
    });

    // Mouse: a click without drag attacks; dragging orbits the camera. Right button holds aim/lock.
    window.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.target.closest?.('#game canvas')) {
        this.device = 'keyboard';
        if (event.button === 0) this.pointerStart = { x: event.clientX, y: event.clientY };
        if (event.button === 2) this.down('aim');
      } else if (event.pointerType === 'touch') {
        this.device = 'touch';
      }
    });
    window.addEventListener('pointerup', event => {
      if (event.pointerType !== 'mouse') return;
      if (event.button === 0 && this.pointerStart) {
        const moved = Math.hypot(event.clientX - this.pointerStart.x, event.clientY - this.pointerStart.y);
        this.pointerStart = null;
        if (moved < 6) this.down('attack');
        this.up('attack');
      }
      if (event.button === 2) this.up('aim');
    });
    window.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('blur', () => {
      this.held.clear();
      this.pressed.clear();
      this.pointerStart = null;
      this.look = { x: 0, y: 0 };
      this.stick = { pointerId: null, x: 0, y: 0, magnitude: 0 };
    });
    window.addEventListener('gamepadconnected', event => { this.padName = event.gamepad.id; });
    window.addEventListener('gamepaddisconnected', () => {
      this.padName = '';
      this.padMove = { x: 0, z: 0 };
      for (const action of this.padHeld) this.up(action);
      this.padHeld.clear();
      this.device = this.hasTouch ? 'touch' : 'keyboard';
    });

    // Touch buttons: hold/hit semantics come from [data-action] in the shell.
    document.querySelectorAll('[data-action]').forEach(button => {
      const action = button.dataset.action;
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.device = 'touch';
        this.down(action);
        this.pointerActions.set(event.pointerId, action);
      });
      for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        button.addEventListener(name, () => this.up(action));
      }
    });
    // A button can be hidden while held (MENU pauses, STAFF hides while aiming). Release it from
    // the window so its action cannot stay stuck down.
    const releasePointer = event => {
      const action = this.pointerActions.get(event.pointerId);
      if (action) {
        this.pointerActions.delete(event.pointerId);
        this.up(action);
      }
    };
    window.addEventListener('pointerup', releasePointer);
    window.addEventListener('pointercancel', releasePointer);

    this.bindStick();
  }

  // Call of Duty-style left thumbstick: analog within its base, recentres on release.
  bindStick() {
    const zone = document.querySelector('#stick-zone');
    if (!zone) return;
    const base = zone.querySelector('#stick-base');
    const knob = zone.querySelector('#stick-knob');
    const release = event => {
      if (event.pointerId !== this.stick.pointerId) return;
      this.stick = { pointerId: null, x: 0, y: 0, magnitude: 0 };
      if (knob) knob.style.transform = '';
    };
    zone.addEventListener('pointerdown', event => {
      event.preventDefault();
      if (this.stick.pointerId !== null) return;
      this.stick.pointerId = event.pointerId;
      zone.setPointerCapture(event.pointerId);
      this.device = 'touch';
      this.trackStick(event, base, knob);
    });
    zone.addEventListener('pointermove', event => {
      if (event.pointerId === this.stick.pointerId) this.trackStick(event, base, knob);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      zone.addEventListener(name, release);
    }
  }

  trackStick(event, base, knob) {
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const radius = rect.width / 2;
    const vector = joystick(
      event.clientX - (rect.left + radius),
      event.clientY - (rect.top + radius),
      radius,
      CONFIG.stickDeadzone
    );
    this.stick = { pointerId: this.stick.pointerId, x: vector.x, y: vector.y, magnitude: vector.magnitude };
    if (knob) {
      knob.style.transform = `translate(${vector.x * radius * .6}px, ${vector.y * radius * .6}px)`;
    }
  }

  down(action) {
    if (!this.held.has(action)) this.pressed.add(action);
    this.held.add(action);
  }
  up(action) { this.held.delete(action); }
  // Drop queued edge presses without releasing held keys; used when the match restarts.
  reset() { this.pressed.clear(); this.pointerStart = null; this.look = { x: 0, y: 0 }; }

  update(dt = 1 / 60) {
    this.look = { x: 0, y: 0 };
    const pads = navigator.getGamepads?.() || [];
    const pad = [...pads].find(Boolean);
    if (!pad) {
      this.padMove = { x: 0, z: 0 };
      return;
    }
    this.padName = pad.id;
    this.device = 'gamepad';
    const buttons = pad.buttons;
    const axes = pad.axes;
    const current = new Set();

    const axisX = deadzone(axes[0] || 0, .2);
    const axisZ = deadzone(axes[1] || 0, .2);
    this.padMove = { x: axisX, z: axisZ };
    if (axisZ < 0) current.add('forward');
    if (axisZ > 0) current.add('back');
    if (axisX < 0) current.add('left');
    if (axisX > 0) current.add('right');

    // Standard Gamepad API layout: south/east/west face buttons, triggers, stick clicks.
    if (buttons[0]?.pressed) current.add('jump');
    if (buttons[1]?.pressed) current.add('guard');
    if (buttons[2]?.pressed) current.add('interact');
    if (buttons[6]?.pressed) current.add('aim');
    if (buttons[7]?.pressed) current.add('attack');
    if (buttons[10]?.pressed) current.add('sprint');
    if (buttons[11]?.pressed) current.add('crouch');
    if (buttons[9]?.pressed) current.add('confirm');

    const lookX = deadzone(axes[2] || 0, .22);
    const lookY = deadzone(axes[3] || 0, .22);
    if (lookX || lookY) {
      this.look.x += lookX * CONFIG.gamepadLookSpeed * dt;
      this.look.y += lookY * CONFIG.gamepadLookSpeed * dt;
    }

    for (const action of current) if (!this.padHeld.has(action)) this.down(action);
    for (const action of this.padHeld) if (!current.has(action)) this.up(action);
    this.padHeld = current;
  }

  // Analog movement in gameplay space: x is right, z is back (-z is forward). Magnitude <= 1.
  move() {
    if (this.stick.magnitude > 0) {
      return { x: this.stick.x, z: this.stick.y, magnitude: this.stick.magnitude };
    }
    if (this.padMove.x || this.padMove.z) {
      return { ...this.padMove, magnitude: Math.min(1, Math.hypot(this.padMove.x, this.padMove.z)) };
    }
    let x = 0;
    let z = 0;
    if (this.isDown('right')) x += 1;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('back')) z += 1;
    if (this.isDown('forward')) z -= 1;
    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }
    return { x, z, magnitude: Math.min(1, length) };
  }

  // Accumulated right-stick look for this frame. Touch/mouse drags are applied by world.js.
  consumeLook() {
    const look = this.look;
    this.look = { x: 0, y: 0 };
    return look;
  }

  deviceLabel() {
    if (this.device === 'gamepad') return `INPUT: ${this.padType()}`;
    return this.device === 'touch' ? 'INPUT: TOUCH' : 'INPUT: KEYBOARD / MOUSE';
  }

  padType() {
    const id = this.padName.toLowerCase();
    if (/playstation|dualshock|dualsense|wireless controller/.test(id)) return 'PLAYSTATION CONTROLLER';
    if (/xbox/.test(id)) return 'XBOX CONTROLLER';
    return 'GAMEPAD';
  }

  controlHints(phase, down) {
    if (down) {
      if (this.device === 'touch') return 'GET UP: tap A / UP';
      if (this.device === 'gamepad') return `GET UP: ${this.padType().includes('PLAYSTATION') ? 'CROSS' : 'A'} / CONFIRM`;
      return 'GET UP: Enter / Space';
    }
    if (this.device === 'touch') {
      return 'Left stick move · drag right to look · AIM then FIRE · tap GUARD to block, direction dodges';
    }
    if (this.device === 'gamepad') {
      const ps = this.padType().includes('PLAYSTATION');
      return ps
        ? 'Left stick move · right stick look · L2 aim · R2 staff · Cross jump · Circle guard · L3 run · R3 crouch'
        : 'Left stick move · right stick look · LT aim · RT staff · A jump · B guard · L3 run · R3 crouch';
    }
    return 'WASD move · LMB staff · RMB aim · Space jump · Shift sprint · Ctrl crouch · Q guard · F interact · Enter confirm';
  }

  isDown(action) { return this.held.has(action); }
  consume(action) {
    const active = this.pressed.has(action);
    this.pressed.delete(action);
    return active;
  }
  endFrame() { this.pressed.clear(); }
}

export const KEYS = {
  KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', KeyJ: 'attack', Enter: 'confirm', KeyF: 'interact',
  KeyQ: 'guard', KeyK: 'guard',
  ShiftLeft: 'sprint', ShiftRight: 'sprint',
  ControlLeft: 'crouch', ControlRight: 'crouch',
  Escape: 'pause'
};
