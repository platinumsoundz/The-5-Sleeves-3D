// Normalizes every device into named actions so gameplay never checks raw keys or button numbers.
export class Input {
  constructor() {
    this.held = new Set();
    this.pressed = new Set();
    this.padHeld = new Set();
    this.padName = '';
    this.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.device = this.hasTouch ? 'touch' : 'keyboard';
    this.lastSource = this.device;

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

    // Mouse: left button attacks; right button holds lock-on/aim.
    window.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.target.closest('#game canvas')) {
        this.device = 'keyboard';
        if (event.button === 0) this.down('attack');
        if (event.button === 2) this.down('aim');
      } else if (event.pointerType === 'touch') {
        this.device = 'touch';
      }
    });
    window.addEventListener('pointerup', event => {
      if (event.pointerType === 'mouse') {
        if (event.button === 0) this.up('attack');
        if (event.button === 2) this.up('aim');
      }
    });
    window.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('blur', () => { this.held.clear(); this.pressed.clear(); });
    window.addEventListener('gamepadconnected', event => { this.padName = event.gamepad.id; });
    window.addEventListener('gamepaddisconnected', () => { this.padName = ''; this.padHeld.clear(); });

    document.querySelectorAll('[data-action]').forEach(button => {
      const action = button.dataset.action;
      button.addEventListener('pointerdown', event => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.device = 'touch';
        this.down(action);
      });
      for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        button.addEventListener(name, () => this.up(action));
      }
    });
  }

  down(action) {
    if (!this.held.has(action)) this.pressed.add(action);
    this.held.add(action);
  }
  up(action) { this.held.delete(action); }

  update() {
    const pads = navigator.getGamepads?.() || [];
    const pad = [...pads].find(Boolean);
    if (!pad) return;
    this.padName = pad.id;
    this.device = 'gamepad';
    const buttons = pad.buttons;
    const axes = pad.axes;
    const current = new Set();
    if ((axes[1] || 0) < -0.25) current.add('forward');
    if ((axes[1] || 0) > 0.25) current.add('back');
    if ((axes[0] || 0) < -0.25) current.add('left');
    if ((axes[0] || 0) > 0.25) current.add('right');
    // Standard Gamepad API layout: south/east/west face buttons, triggers, stick clicks.
    if (buttons[0]?.pressed) current.add('jump');
    if (buttons[1]?.pressed) current.add('dodge');
    if (buttons[2]?.pressed) current.add('interact');
    if (buttons[6]?.pressed) current.add('aim');
    if (buttons[7]?.pressed) current.add('attack');
    if (buttons[10]?.pressed) current.add('sprint');
    if (buttons[11]?.pressed) current.add('crouch');
    if (buttons[9]?.pressed) current.add('confirm');

    for (const action of current) if (!this.padHeld.has(action)) this.down(action);
    for (const action of this.padHeld) if (!current.has(action)) this.up(action);
    this.padHeld = current;
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
      return 'GET UP: Enter';
    }
    if (this.device === 'touch') return 'Drag to look · Staff · Aim · Jump · Dodge · Run · Crouch';
    if (this.device === 'gamepad') {
      const ps = this.padType().includes('PLAYSTATION');
      return ps ? 'Hold L2 lock · R2 staff · Cross jump · Circle dodge · L3 run · R3 crouch' : 'Hold LT lock · RT staff · A jump · B dodge · L3 run · R3 crouch';
    }
    return 'WASD move · Mouse drag look · Right-click hold lock · Left-click / J staff · Space jump · K dodge · Shift run · Ctrl crouch';
  }

  isDown(action) { return this.held.has(action); }
  consume(action) {
    const active = this.pressed.has(action);
    this.pressed.delete(action);
    return active;
  }
  endFrame() { this.pressed.clear(); }
}

const KEYS = {
  KeyW: 'forward', ArrowUp: 'forward', KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', KeyJ: 'attack', Enter: 'confirm', KeyE: 'aim',
  ShiftLeft: 'sprint', ShiftRight: 'sprint', ControlLeft: 'crouch',
  ControlRight: 'crouch', KeyK: 'dodge', KeyX: 'interact'
};