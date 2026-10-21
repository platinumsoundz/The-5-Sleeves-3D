// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Headless checks for every rules module plus the Game wiring. No renderer and no DOM: world,
// input and UI are stubs. Visual layout, camera, touch and gamepad still need the device pass
// described in docs/memory/03-technical.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { Events } from '../src/events.js';
import { FighterState, HIT, IGNORED, KNOCKDOWN, RECOVERED } from '../src/fighter.js';
import { CombatState } from '../src/combat.js';
import { SenseiAI } from '../src/ai.js';
import { Match } from '../src/match.js';
import { Game } from '../src/game.js';
import { clamp, deadzone, joystick } from '../src/controls.js';
import { KEYS } from '../src/input.js';
import { DEFAULTS, loadSettings, sanitize, saveSettings, SETTINGS_KEY } from '../src/settings.js';

const DT = 1 / 60;
const frames = seconds => Math.ceil(seconds / DT) + 2;

class Vec3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
  set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  distanceTo(other) { return Math.hypot(this.x - other.x, this.y - other.y, this.z - other.z); }
}

const fighter = z => ({ position: new Vec3(0, 0, z), rotation: new Vec3(), scale: new Vec3(1, 1, 1), userData: {} });
const element = () => ({
  textContent: '', hidden: false, onclick: null, style: {},
  classList: {
    values: new Set(),
    toggle(name, on) { if (on) this.values.add(name); else this.values.delete(name); },
    contains(name) { return this.values.has(name); }
  }
});

function makeWorld() {
  return {
    player: fighter(2.5),
    sensei: fighter(-2.5),
    playerParts: { stick: { rotation: new Vec3() } },
    senseiParts: { stick: { rotation: new Vec3() } },
    locked: false,
    setLocked(value) { this.locked = value; }
  };
}

function makeUi() {
  return {
    skip: element(), restart: element(), message: element(), phase: element(),
    score: element(), warning: element(), playerHealth: element(), senseiHealth: element(), prompt: element(),
    device: element(), touchControls: element(), result: element(), loading: element(),
    fire: element(), reticle: element(), pause: element(), settings: element()
  };
}

function makeInput() {
  const held = new Set();
  const pressed = new Set();
  return {
    device: 'keyboard', held, pressed, moveOverride: null,
    update() {},
    endFrame() { pressed.clear(); },
    reset() { pressed.clear(); },
    isDown(action) { return held.has(action); },
    consume(action) { const active = pressed.has(action); pressed.delete(action); return active; },
    press(action) { pressed.add(action); held.add(action); },
    release(action) { held.delete(action); },
    move() {
      if (this.moveOverride) return this.moveOverride;
      const x = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
      const z = (held.has('back') ? 1 : 0) - (held.has('forward') ? 1 : 0);
      return { x, z, magnitude: Math.min(1, Math.hypot(x, z)) };
    },
    consumeLook() { return { x: 0, y: 0 }; },
    deviceLabel() { return 'INPUT: KEYBOARD / MOUSE'; },
    controlHints() { return ''; }
  };
}

function makeGame() {
  const world = makeWorld();
  const ui = makeUi();
  const input = makeInput();
  return { game: new Game(world, input, ui), world, ui, input };
}

const step = (game, count = 1) => { for (let i = 0; i < count; i++) game.update(DT); };

function withAccuracy(value, run) {
  const original = CONFIG.senseiAccuracy;
  CONFIG.senseiAccuracy = value;
  try { return run(); } finally { CONFIG.senseiAccuracy = original; }
}

function knockDownSensei(game, input) {
  for (let i = 0; i < Math.ceil(100 / CONFIG.damage); i++) {
    input.press('attack');
    step(game);
    step(game, frames(CONFIG.attackCooldown));
  }
}

function advanceToWindup(game, limit = 120) {
  for (let i = 0; i < limit; i++) {
    if (game.ai.windingUp) return true;
    step(game);
  }
  return game.ai.windingUp;
}

// --- Events -------------------------------------------------------------------------------

test('events deliver payloads and unsubscribe cleanly', () => {
  const events = new Events();
  const seen = [];
  const off = events.on('hit', payload => seen.push(payload));
  events.emit('hit', 1);
  off();
  events.emit('hit', 2);
  assert.deepEqual(seen, [1]);
});

// --- Fighter rules ------------------------------------------------------------------------

test('fighter takes hits, knocks down at zero, and ignores hits while down', () => {
  const fighterState = new FighterState();
  assert.equal(fighterState.hit(40), HIT);
  assert.equal(fighterState.hp, 60);
  assert.equal(fighterState.hit(60), KNOCKDOWN);
  assert.equal(fighterState.hp, 0);
  assert.ok(fighterState.isDown);
  assert.equal(fighterState.hit(12), IGNORED);
});

test('Sensei recovers automatically, the player waits for confirmation', () => {
  const sensei = new FighterState();
  sensei.hit(100);
  assert.equal(sensei.tick(CONFIG.knockdown + 0.1), RECOVERED);
  assert.equal(sensei.hp, 100);
  assert.equal(sensei.isDown, false);

  const player = new FighterState({ needsConfirm: true });
  player.hit(100);
  assert.equal(player.tick(CONFIG.knockdown + 0.1), null);
  assert.equal(player.hp, 0);
  assert.equal(player.awaitingConfirm, true);
  assert.equal(player.confirm(), true);
  assert.equal(player.hp, 100);
  assert.equal(player.confirm(), false);
});

// --- Combat timers ------------------------------------------------------------------------

test('attack cooldown blocks a second swing until it expires', () => {
  const combat = new CombatState();
  assert.equal(combat.canAttack, true);
  combat.beginAttack();
  assert.equal(combat.canAttack, false);
  combat.tick(CONFIG.attackCooldown / 2);
  assert.equal(combat.canAttack, false);
  combat.tick(CONFIG.attackCooldown);
  assert.equal(combat.canAttack, true);
});

test('blocked hits stack into a guard break, and pressure decays', () => {
  const combat = new CombatState();
  assert.equal(combat.registerBlock(), false);
  assert.equal(combat.registerBlock(), false);
  assert.equal(combat.registerBlock(), true);
  assert.equal(combat.guardBroken, true);
  combat.tick(CONFIG.guardBreakStun + 0.01);
  assert.equal(combat.guardBroken, false);

  const decay = new CombatState();
  decay.registerBlock();
  decay.registerBlock();
  decay.tick(CONFIG.guardBreakWindow + 0.01);
  assert.equal(decay.blockedHits, 0, 'old blocks should not count forever');
});

test('guard presses cannot re-arm the parry while locked', () => {
  const combat = new CombatState();
  assert.equal(combat.beginGuard(), true);
  combat.tick(CONFIG.parryWindow + 0.01);
  assert.equal(combat.parryReady, false);
  assert.equal(combat.beginGuard(), false, 'mashing should not re-arm the parry');
  combat.tick(CONFIG.parryWindow + CONFIG.parryRecover + 0.01);
  assert.equal(combat.beginGuard(), true);
});

test('dodge grants invulnerability and normalizes its direction', () => {
  const combat = new CombatState();
  combat.beginDodge(1, 0, 0);
  assert.equal(combat.invulnerable, true);
  assert.deepEqual(combat.dodgeDir, { x: 1, z: 0 });
  combat.tick(CONFIG.dodgeTime + 0.01);
  assert.equal(combat.invulnerable, false);
});

test('swing angle arcs out and returns to rest', () => {
  const combat = new CombatState();
  assert.equal(combat.swingAngle, 0);
  combat.beginAttack();
  const mid = Math.floor(CONFIG.attackAnimTime / DT / 2);
  for (let i = 0; i < mid; i++) combat.tick(DT);
  assert.ok(combat.swingAngle > 0.5);
  combat.tick(CONFIG.attackAnimTime);
  assert.equal(combat.swingAngle, 0);
});

// --- Sensei AI ----------------------------------------------------------------------------

test('Sensei idles when inactive, approaches when far and telegraphs before striking', () => {
  const ai = new SenseiAI();
  assert.equal(ai.update(DT, { active: false, distance: 5 }).approach, false);
  assert.equal(ai.state, 'idle');

  const approach = ai.update(DT, { active: true, distance: 5 });
  assert.equal(approach.approach, true);
  assert.equal(ai.state, 'approach');

  const windup = ai.update(DT, { active: true, distance: CONFIG.senseiReach - 0.1 });
  assert.equal(windup.strike, false, 'a wind-up must not hit immediately');
  assert.equal(ai.state, 'windup');
  assert.equal(ai.windingUp, true);
});

test('a completed wind-up strikes only when the target is in reach', () => withAccuracy(1, () => {
  const early = new SenseiAI();
  early.update(DT, { active: true, distance: CONFIG.senseiReach - 0.1 });
  let struck = false;
  for (let i = 0; i < frames(CONFIG.senseiWindup); i++) {
    struck = struck || early.update(DT, { active: true, distance: CONFIG.senseiReach - 0.1 }).strike;
  }
  assert.equal(struck, true);

  const far = new SenseiAI();
  far.update(DT, { active: true, distance: CONFIG.senseiReach - 0.1 });
  let farStruck = false;
  for (let i = 0; i < frames(CONFIG.senseiWindup); i++) {
    farStruck = farStruck || far.update(DT, { active: true, distance: CONFIG.senseiReach + 2 }).strike;
  }
  assert.equal(farStruck, false);
}));

test('stagger interrupts Sensei and a noticed whiff arms a faster punish', () => {
  const ai = new SenseiAI();
  ai.stagger(1);
  assert.equal(ai.staggered, true);
  assert.equal(ai.update(DT, { active: true, distance: 1 }).strike, false);
  for (let i = 0; i < frames(1); i++) ai.update(DT, { active: true, distance: 1 });
  assert.equal(ai.staggered, false);

  const punisher = new SenseiAI();
  punisher.noticeWhiff(CONFIG.senseiReach + 0.5);
  assert.equal(punisher.punishing, true);
  assert.equal(punisher.update(DT, { active: true, distance: CONFIG.senseiReach + 0.5 }).approach, true);
  assert.equal(punisher.update(DT, { active: true, distance: CONFIG.senseiReach - 0.05 }).state, 'windup');

  const honest = new SenseiAI();
  honest.noticeWhiff(CONFIG.senseiReach + CONFIG.whiffPunishReach + 1);
  assert.equal(honest.punishing, false);
});

test('Sensei misses when accuracy is zero or the player dodges away', () => {
  withAccuracy(0, () => {
    const ai = new SenseiAI();
    ai.update(DT, { active: true, distance: 1 });
    let struck = false;
    for (let i = 0; i < frames(CONFIG.senseiWindup); i++) {
      struck = struck || ai.update(DT, { active: true, distance: 1 }).strike;
    }
    assert.equal(struck, false);
  });

  withAccuracy(1, () => {
    const ai = new SenseiAI();
    ai.update(DT, { active: true, distance: 1 });
    let struck = false;
    for (let i = 0; i < frames(CONFIG.senseiWindup); i++) {
      struck = struck || ai.update(DT, { active: true, distance: 1, playerInvulnerable: true }).strike;
    }
    assert.equal(struck, false);
  });
});

test('a strike misses if the player leaves reach during the wind-up', () => {
  withAccuracy(1, () => {
    const ai = new SenseiAI();
    ai.update(DT, { active: true, distance: 1 });
    let struck = false;
    for (let i = 0; i < frames(CONFIG.senseiWindup); i++) {
      struck = struck || ai.update(DT, { active: true, distance: CONFIG.senseiReach + 2 }).strike;
    }
    assert.equal(struck, false);
  });
});

// --- Match scoring ------------------------------------------------------------------------

test('match is first to the configured knockdowns and then locks', () => {
  const match = new Match();
  assert.equal(match.award('player'), false);
  assert.equal(match.award('sensei'), false);
  assert.equal(match.award('player'), false);
  assert.equal(match.award('player'), true);
  assert.equal(match.over, true);
  assert.equal(match.winner, 'player');
  assert.equal(match.player, 3);
  assert.equal(match.award('sensei'), true, 'scoring after the end changes nothing');
  assert.equal(match.sensei, 1);
});

// --- Game: tutorial and spar --------------------------------------------------------------

test('starts in the tutorial with skip available and restart hidden', () => {
  const { game, ui } = makeGame();
  assert.equal(game.phase, 'tutorial');
  assert.equal(game.step, 0);
  assert.equal(ui.skip.hidden, false);
  assert.equal(ui.restart.hidden, true);
  assert.equal(ui.result.hidden, true);

  ui.skip.onclick();
  assert.equal(game.phase, 'spar');
  assert.equal(ui.skip.hidden, true);
  assert.equal(ui.restart.hidden, false);
});

test('Sensei stays passive during the tutorial', () => {
  const { game, world } = makeGame();
  world.player.position.set(0, 0, -1);
  const senseiZ = world.sensei.position.z;
  step(game, 300);
  assert.equal(game.playerHp, 100);
  assert.equal(game.enemyHp, 100);
  assert.equal(world.sensei.position.z, senseiZ);
});

test('tutorial advances through move, attack, aim, dodge and confirm', () => {
  const { game, input } = makeGame();
  input.held.add('forward'); step(game); input.release('forward');
  assert.equal(game.step, 1);

  input.held.add('attack'); step(game); input.release('attack');
  assert.equal(game.step, 2);

  input.press('aim'); step(game);
  assert.equal(game.step, 3);

  input.press('guard'); step(game);
  assert.equal(game.step, 4);

  input.press('confirm'); step(game);
  assert.equal(game.phase, 'spar');
});

test('staff swings do no damage during the tutorial, then damage in range', () => {
  const { game, world, input } = makeGame();
  world.player.position.set(0, 0, -1.5);
  input.press('attack'); step(game);
  assert.equal(game.enemyHp, 100);

  game.finishTutorial();
  step(game, frames(CONFIG.attackCooldown));
  world.player.position.set(0, 0, -1.5);
  input.press('attack'); step(game);
  assert.equal(game.enemyHp, 100 - CONFIG.damage);
});

test('out-of-range swings miss', () => {
  const { game, input } = makeGame();
  game.finishTutorial();
  input.press('attack'); step(game);
  assert.equal(game.enemyHp, 100);
});

test('guard with no direction parries when timed just before the strike', () => withAccuracy(1, () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  assert.ok(advanceToWindup(game), 'Sensei should wind up');

  for (let i = 0; i < 60 && game.ai.windingUp && game.ai.timer > CONFIG.parryWindow * 0.5; i++) step(game);
  let parried = false;
  game.events.on('parry', () => { parried = true; });
  input.press('guard');
  step(game);
  assert.ok(game.playerCombat.parryTimer > 0, 'the parry window should open');
  assert.equal(game.blocking, true);

  step(game, frames(CONFIG.senseiWindup));
  assert.equal(parried, true);
  assert.equal(game.playerHp, 100, 'a parry negates the strike');
  assert.equal(game.ai.state, 'stagger');
}));

test('holding guard past the parry window blocks for reduced damage', () => withAccuracy(1, () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  input.press('guard');
  step(game);
  step(game, frames(CONFIG.parryWindow));
  assert.equal(game.blocking, true);
  assert.equal(game.playerCombat.parryTimer, 0, 'the parry window has closed');

  step(game, frames(CONFIG.senseiWindup));
  assert.equal(game.playerHp, 100 - CONFIG.senseiDamage * CONFIG.blockDamageScale);
}));

test('repeated blocks break the guard and briefly stop blocking', () => withAccuracy(1, () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  input.press('guard');
  let broken = false;
  game.events.on('guard-break', () => { broken = true; });
  for (let i = 0; i < frames(5) && !broken; i++) step(game);
  assert.equal(broken, true, 'three blocked hits should break the guard');

  step(game);
  assert.equal(game.blocking, false, 'a broken guard cannot block');
  step(game, frames(CONFIG.guardBreakStun));
  assert.equal(game.blocking, true, 'holding guard re-establishes the block');
}));

test('guard with a direction dodges instead of blocking', () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  input.held.add('left');
  input.press('guard');
  step(game);
  step(game);
  input.release('left');
  assert.ok(game.playerCombat.dodgeTimer > 0);
  assert.equal(game.playerCombat.parryTimer, 0);
  assert.equal(game.playerCombat.dodgeDir.x, -1);
  assert.equal(game.playerCombat.dodgeDir.z, 0);
  assert.equal(game.blocking, false, 'a dodge is not a block');
});

test('crouching is posture, not defense', () => withAccuracy(1, () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  input.held.add('crouch');
  step(game, frames(CONFIG.senseiWindup));
  assert.equal(game.playerHp, 100 - CONFIG.senseiDamage);
}));

test('a whiffed swing invites a shortened punish wind-up', () => withAccuracy(0, () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, 0);
  input.press('attack');
  step(game);
  assert.equal(game.enemyHp, 100, 'the swing should miss at 2.5 units');
  assert.equal(game.ai.punishing, true);

  let windupTimer = null;
  let wasWinding = false;
  for (let i = 0; i < frames(1); i++) {
    step(game);
    if (game.ai.windingUp && !wasWinding) windupTimer = game.ai.timer;
    wasWinding = game.ai.windingUp;
  }
  assert.ok(windupTimer !== null, 'Sensei should wind up after the whiff');
  assert.ok(windupTimer <= CONFIG.senseiPunishWindup + DT, `first punish wind-up was ${windupTimer}`);
}));

test('the HUD warns during the wind-up and clears after it', () => withAccuracy(1, () => {
  const { game, world, ui } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  step(game);
  assert.equal(game.ai.windingUp, true);
  assert.equal(ui.warning.hidden, false);

  step(game, frames(CONFIG.senseiWindup));
  assert.equal(game.ai.windingUp, false);
  assert.equal(ui.warning.hidden, true);
}));

test('knockdown zeroes the health bar and scores a point', () => withAccuracy(0, () => {
  const { game, world, ui, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  knockDownSensei(game, input);

  assert.equal(game.enemyHp, 0);
  assert.ok(game.enemyDown > 0);
  assert.equal(game.match.player, 1);
  assert.equal(ui.senseiHealth.style.width, '0%');
  assert.equal(ui.score.textContent, '●○○ — ○○○');

  step(game, frames(CONFIG.knockdown) + 2);
  assert.equal(game.enemyDown, 0);
  assert.equal(game.enemyHp, 100);
  assert.equal(world.sensei.rotation.z, 0);
  assert.equal(world.sensei.position.y, 0);
}));

test('round reset returns both fighters to their marks without clearing the score', () => withAccuracy(0, () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  knockDownSensei(game, input);
  assert.equal(game.match.player, 1);

  let snapshot = null;
  game.events.on('round-start', () => {
    snapshot = {
      playerZ: world.player.position.z,
      senseiZ: world.sensei.position.z,
      playerHp: game.playerHp,
      senseiHp: game.enemyHp
    };
  });
  step(game, frames(CONFIG.knockdown + CONFIG.roundPause));
  assert.ok(snapshot, 'the round should restart after recovery and the pause');
  assert.equal(snapshot.playerZ, 2.5);
  assert.equal(snapshot.senseiZ, -2.5);
  assert.equal(snapshot.playerHp, 100);
  assert.equal(snapshot.senseiHp, 100);
  assert.equal(game.match.player, 1);
}));

test('downed player stays down until confirming, then returns at full health', () => withAccuracy(1, () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  game.playerHp = CONFIG.senseiDamage;

  step(game, frames(CONFIG.senseiWindup));
  assert.equal(game.playerHp, 0);
  assert.ok(game.playerDown > 0);
  assert.equal(game.match.sensei, 1);

  step(game, frames(CONFIG.knockdown) + 2);
  assert.equal(game.playerDown, -1, 'no automatic recovery');

  CONFIG.senseiAccuracy = 0;
  input.press('confirm'); step(game);
  assert.equal(game.playerDown, 0);
  assert.equal(game.playerHp, 100);
}));

test('a third knockdown ends the spar and freezes movement', () => withAccuracy(0, () => {
  const { game, world, ui, input } = makeGame();
  game.finishTutorial();
  game.match.player = 2;
  world.player.position.set(0, 0, -1);
  knockDownSensei(game, input);

  assert.equal(game.phase, 'result');
  assert.equal(game.match.winner, 'player');
  assert.equal(ui.result.hidden, false);
  assert.equal(ui.result.textContent, 'YOU WIN THE SPAR');
  assert.equal(ui.phase.textContent, 'SPAR COMPLETE');
  assert.equal(ui.skip.hidden, true);
  assert.equal(ui.restart.hidden, false);

  const frozenZ = world.player.position.z;
  input.held.add('forward');
  step(game, 20);
  input.release('forward');
  assert.equal(world.player.position.z, frozenZ);
}));

test('Sensei can take the spar too', () => withAccuracy(1, () => {
  const { game, world, ui } = makeGame();
  game.finishTutorial();
  game.match.sensei = 2;
  world.player.position.set(0, 0, -1);
  game.playerHp = CONFIG.senseiDamage;
  step(game, frames(CONFIG.senseiWindup));
  assert.equal(game.phase, 'result');
  assert.equal(ui.result.textContent, 'SENSEI WINS THE SPAR');
}));

test('jump clears the idle settle and lands back on the ground', () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  let peak = 0;
  input.press('jump');
  for (let i = 0; i < 90; i++) {
    step(game);
    peak = Math.max(peak, world.player.position.y);
  }
  assert.ok(peak > 0.95, `peak ${peak.toFixed(3)} should exceed 0.95`);
  assert.ok(peak < 1.4, `peak ${peak.toFixed(3)} should stay within the arena scale`);
  assert.ok(world.player.position.y < 0.01, 'player should settle back down after landing');
});

test('restart clears knockdown poses, score and stale input', () => withAccuracy(0, () => {
  const { game, world, ui, input } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  knockDownSensei(game, input);
  assert.ok(game.enemyDown > 0);

  input.pressed.add('attack');
  game.restart();

  assert.equal(game.phase, 'tutorial');
  assert.equal(game.match.player, 0);
  assert.equal(ui.score.textContent, '○○○ — ○○○');
  assert.equal(ui.result.hidden, true);
  assert.equal(world.sensei.rotation.z, 0);
  assert.equal(world.sensei.position.y, 0);
  assert.equal(world.player.rotation.z, 0);
  assert.equal(world.player.scale.y, 1);
  assert.equal(world.player.userData.vy, 0);
  assert.equal(world.player.position.z, 2.5);
  assert.equal(input.pressed.size, 0);

  step(game, 10);
  assert.equal(world.sensei.rotation.z, 0, 'Sensei must not stay lying down after restart');
}));

test('a long seeded spar stays in bounds and reaches a result', () => withAccuracy(0.6, () => {
  const { game, world, input } = makeGame();
  game.finishTutorial();
  const random = seeded(20261021);
  const actions = ['forward', 'back', 'left', 'right', 'attack', 'guard', 'jump', 'sprint', 'aim', 'crouch', 'confirm'];
  let ended = false;

  for (let frame = 0; frame < 60 * 300 && !ended; frame++) {
    if (frame % 12 === 0) {
      input.held.clear();
      for (const action of actions) if (random() < 0.22) input.press(action);
    }
    step(game);
    for (const fighter of [world.player, world.sensei]) {
      assert.ok(Number.isFinite(fighter.position.x) && Number.isFinite(fighter.position.z), 'no NaN positions');
      assert.ok(Math.abs(fighter.position.x) <= CONFIG.arenaLimit + 1e-9, 'x stays in the arena');
      assert.ok(Math.abs(fighter.position.z) <= CONFIG.arenaLimit + 1e-9, 'z stays in the arena');
    }
    ended = game.phase === 'result';
  }

  assert.ok(ended, 'a spar should finish within the simulation budget');
  assert.ok(game.match.player >= CONFIG.pointsToWin || game.match.sensei >= CONFIG.pointsToWin);
}));

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test('joystick math has a deadzone, full deflection and screen-space axes', () => {
  assert.deepEqual(joystick(4, -3, 60, .15), { x: 0, y: 0, magnitude: 0 });

  const full = joystick(60, 0, 60, .15);
  assert.equal(full.magnitude, 1);
  assert.equal(full.x, 1);
  assert.equal(full.y, 0);

  const half = joystick(0, 30, 60, .15);
  assert.ok(half.magnitude > .3 && half.magnitude < .7, `half tilt was ${half.magnitude}`);
  assert.equal(half.x, 0);
  assert.ok(half.y > 0, 'screen down should be positive y');
});

test('deadzone rescales instead of snapping to full tilt', () => {
  assert.equal(deadzone(.1, .2), 0);
  assert.equal(deadzone(-1, .2), -1);
  const mid = deadzone(.6, .2);
  assert.ok(mid > .4 && mid < .6, `rescoped axis was ${mid}`);
  assert.equal(clamp(5, -1, 1), 1);
  assert.equal(clamp(-5, -1, 1), -1);
});

test('PC bindings follow the shooter layout', () => {
  assert.equal(KEYS.KeyW, 'forward');
  assert.equal(KEYS.KeyF, 'interact');
  assert.equal(KEYS.Space, 'jump');
  assert.equal(KEYS.ShiftLeft, 'sprint');
  assert.equal(KEYS.ControlLeft, 'crouch');
  assert.equal(KEYS.KeyQ, 'guard');
  assert.equal(KEYS.KeyJ, 'attack');
  assert.equal(KEYS.Enter, 'confirm');
  assert.equal(KEYS.KeyE, undefined, 'E is no longer aim; RMB/LT own that');
});

test('analog move magnitude scales travel speed', () => {
  const slow = makeGame();
  slow.game.finishTutorial();
  slow.input.moveOverride = { x: 0, z: -0.5, magnitude: 0.5 };
  const slowStart = slow.world.player.position.z;
  step(slow.game, 30);
  const slowDistance = Math.abs(slow.world.player.position.z - slowStart);

  const fast = makeGame();
  fast.game.finishTutorial();
  fast.input.moveOverride = { x: 0, z: -1, magnitude: 1 };
  const fastStart = fast.world.player.position.z;
  step(fast.game, 30);
  const fastDistance = Math.abs(fast.world.player.position.z - fastStart);

  assert.ok(fastDistance > slowDistance * 1.8, `${fastDistance} vs ${slowDistance}`);
});

test('touch aim mode reveals the fire button and reticle', () => {
  const { game, input, ui } = makeGame();
  game.finishTutorial();
  assert.equal(ui.fire.hidden, true);
  assert.equal(ui.reticle.hidden, true);

  input.device = 'touch';
  input.held.add('aim');
  step(game);
  assert.equal(game.aiming, true);
  assert.equal(ui.touchControls.hidden, false);
  assert.equal(ui.fire.hidden, false, 'the fire button moves under the left thumb while aiming');
  assert.equal(ui.reticle.hidden, false);
  assert.equal(ui.touchControls.classList.contains('aiming'), true);

  input.release('aim');
  step(game);
  assert.equal(ui.fire.hidden, true);
  assert.equal(ui.reticle.hidden, true);
  assert.equal(ui.touchControls.classList.contains('aiming'), false);

  const desktop = makeGame();
  desktop.game.finishTutorial();
  desktop.input.held.add('aim');
  step(desktop.game);
  assert.equal(desktop.ui.fire.hidden, true, 'no touch fire button on desktop');
  assert.equal(desktop.ui.reticle.hidden, false, 'desktop aim still shows the reticle');
});

test('settings clamp, default and round-trip through storage', () => {
  assert.deepEqual(sanitize({}), DEFAULTS);
  assert.equal(sanitize({ sensitivity: 99 }).sensitivity, 2);
  assert.equal(sanitize({ sensitivity: .01 }).sensitivity, .4);
  assert.equal(sanitize({ sensitivity: 'nope' }).sensitivity, 1);
  assert.equal(sanitize({ quality: 'ultra' }).quality, 'balanced');
  assert.equal(sanitize({ invertY: 'true' }).invertY, true);

  const store = new Map();
  const storage = {
    getItem: key => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value)
  };
  assert.deepEqual(loadSettings(storage), DEFAULTS);

  const saved = saveSettings(storage, { sensitivity: 1.35, invertY: true, quality: 'sharp' });
  assert.deepEqual(saved, { sensitivity: 1.35, invertY: true, quality: 'sharp' });
  assert.deepEqual(loadSettings(storage), saved);
  assert.equal(store.has(SETTINGS_KEY), true);

  const broken = { getItem: () => '{oops', setItem() {} };
  assert.deepEqual(loadSettings(broken), DEFAULTS);
  const failing = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); }
  };
  assert.deepEqual(loadSettings(failing), DEFAULTS);
  assert.deepEqual(saveSettings(failing, DEFAULTS), DEFAULTS);
});

test('pause freezes the spar and resumes where it stopped', () => withAccuracy(1, () => {
  const { game, world, input, ui } = makeGame();
  game.finishTutorial();
  world.player.position.set(0, 0, -1);
  assert.equal(KEYS.Escape, 'pause');

  input.press('pause');
  step(game);
  assert.equal(game.paused, true);
  assert.equal(ui.settings.hidden, false);
  assert.equal(ui.pause.hidden, true);

  step(game, frames(4));
  assert.equal(game.playerHp, 100, 'no strikes resolve while paused');
  assert.equal(game.ai.state, 'idle');

  input.press('pause');
  step(game);
  assert.equal(game.paused, false);
  assert.equal(ui.settings.hidden, true);
  step(game, frames(CONFIG.senseiWindup));
  assert.equal(game.playerHp, 100 - CONFIG.senseiDamage);
}));

test('every HUD id main.js queries exists in the shell', async () => {
  const { readFile } = await import('node:fs/promises');
  const main = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const ids = [...main.matchAll(/querySelector\('#([\w-]+)'\)/g)].map(match => match[1]);
  assert.ok(ids.includes('score'), 'the score readout should be wired');
  for (const id of ids) assert.ok(html.includes(`id="${id}"`), `#${id} missing from index.html`);
});
