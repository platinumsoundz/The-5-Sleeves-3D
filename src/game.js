// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (sleeve HUD gating)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (articulated crouch state)
// Sparring loop orchestrator: tutorial, movement, strikes, rounds and match completion.
// Rules live in fighter/combat/ai/match; DOM writes live in hud.js, so this class stays
// runnable under `node --test` with stub world, input and UI objects.
import { CONFIG } from './config.js';
import { Events } from './events.js';
import { FighterState, HIT, KNOCKDOWN, RECOVERED } from './fighter.js';
import { CombatState } from './combat.js';
import { SenseiAI } from './ai.js';
import { Match } from './match.js';
import { Hud } from './hud.js';
import { Resource } from './resources.js';
import { EventFeed } from './log.js';
import { deleteSave, writeSave } from './save.js';
import { redeemDevCode } from './devcodes.js';

const START = { player: 2.5, sensei: -2.5 };
const clamp = n => Math.max(-CONFIG.arenaLimit, Math.min(CONFIG.arenaLimit, n));

export class Game {
  constructor(world, input, ui, { events = new Events() } = {}) {
    Object.assign(this, { world, input, ui, events });
    this.hud = new Hud(ui);
    this.player = new FighterState({ needsConfirm: true });
    this.sensei = new FighterState();
    this.playerCombat = new CombatState();
    this.ai = new SenseiAI();
    this.match = new Match();
    this.stamina = new Resource(CONFIG.maxStamina, { regen: CONFIG.staminaRegen, delay: CONFIG.staminaDelay });
    this.sleeveAcquired = false;
    this.log = new EventFeed();
    this.progress = { xp: 0, cash: 0, permissions: [] };
    this.screen = 'playing';
    this.menuTab = 'status';
    this.menuFrom = 'playing';
    this.saveInfo = null;
    ui.skip.onclick = () => this.finishTutorial();
    ui.restart.onclick = () => this.restart();
    this.restart();
  }

  // Kept for callers and tests written against the original field names.
  get playerHp() { return this.player.hp; }
  set playerHp(value) { this.player.hp = value; }
  get enemyHp() { return this.sensei.hp; }
  set enemyHp(value) { this.sensei.hp = value; }
  get playerDown() { return this.player.down; }
  set playerDown(value) { this.player.down = value; }
  get enemyDown() { return this.sensei.down; }
  set enemyDown(value) { this.sensei.down = value; }
  get attackTimer() { return this.playerCombat.attackTimer; }
  get dodgeTimer() { return this.playerCombat.dodgeTimer; }

  restart() {
    this.phase = 'tutorial';
    this.step = 0;
    this.locked = false;
    this.aiming = false;
    this.blocking = false;
    this.crouching = false;
    this.screen = 'playing';
    this.menuFrom = 'playing';
    this.paused = false;
    this.roundTimer = 0;
    this.resultText = '';
    this.skipVisible = true;
    this.restartVisible = false;
    this.world.setLocked(false);
    this.player.reset();
    this.sensei.reset();
    this.playerCombat.reset();
    this.ai.reset();
    this.match.reset();
    this.stamina.reset();
    this.resetFighters();
    this.input.reset();
    this.show(this.tip({
      pc: 'Step 1/4: move with WASD. Sensei is passive.',
      pad: 'Step 1/4: move with the left stick. Sensei is passive.',
      touch: 'Step 1/4: move with the left stick. Sensei is passive.'
    }));
    this.paint();
    this.events.emit('reset');
  }

  get hasSave() {
    return this.saveInfo !== null;
  }

  showTitle() {
    this.screen = 'title';
    this.menuFrom = 'title';
    this.paused = true;
    this.paint();
  }

  startNew() {
    this.progress = { xp: 0, cash: 0, permissions: [] };
    this.log.clear();
    this.restart();
    this.log.push('Training started.', 'info');
    this.paint();
  }

  applySave(save) {
    this.progress = {
      xp: save?.xp || 0,
      cash: save?.cash || 0,
      permissions: Array.isArray(save?.permissions) ? [...save.permissions] : []
    };
  }

  resume(save) {
    const restored = save || this.saveInfo;
    if (!restored) return false;
    this.applySave(restored);
    this.restart();
    if (restored.tutorialDone) this.finishTutorial();
    this.log.push('Save loaded.', 'good');
    this.paint();
    return true;
  }

  buildSave() {
    return {
      tutorialDone: this.phase !== 'tutorial',
      xp: this.progress.xp,
      cash: this.progress.cash,
      permissions: [...this.progress.permissions]
    };
  }

  saveGame(storage) {
    this.saveInfo = writeSave(storage, this.buildSave());
    this.log.push('Game saved.', 'good');
    this.paint();
    return this.saveInfo;
  }

  clearSave(storage) {
    deleteSave(storage);
    this.saveInfo = null;
    this.log.push('Save deleted.', 'warn');
    this.paint();
  }

  redeemDev(raw) {
    const result = redeemDevCode(this.progress, raw);
    if (result.ok) {
      this.progress = result.save;
      this.log.push(result.message, 'loot');
    }
    this.paint();
    return result;
  }

  setSaveInfo(save) {
    this.saveInfo = save;
    this.paint();
  }

  openMenu(tab = 'status') {
    this.menuFrom = this.screen === 'title' ? 'title' : 'playing';
    this.menuTab = tab;
    this.screen = 'menu';
    this.paused = true;
    this.paint();
  }

  closeMenu() {
    if (this.screen !== 'menu') return;
    if (this.menuFrom === 'title') {
      this.showTitle();
      return;
    }
    this.screen = 'playing';
    this.paused = false;
    this.paint();
  }

  setMenuTab(tab) {
    this.menuTab = tab;
    this.paint();
  }

  openMap() {
    if (this.screen === 'title' || this.screen === 'map') return;
    this.mapFrom = this.screen === 'menu' ? 'menu' : 'playing';
    this.screen = 'map';
    this.paused = true;
    this.paint();
  }

  closeMap() {
    if (this.screen !== 'map') return;
    this.screen = this.mapFrom === 'menu' ? 'menu' : 'playing';
    this.paused = this.screen !== 'playing';
    this.paint();
  }

  finishTutorial() {
    if (this.phase !== 'tutorial') return;
    this.phase = 'spar';
    this.skipVisible = false;
    this.restartVisible = true;
    this.show(`Free spar: first to ${this.match.needed} knockdowns wins. Sensei recovers on his own.`);
    this.log.push(`Free spar — first to ${this.match.needed} knockdowns.`, 'info');
    this.events.emit('tutorial-end');
    this.paint();
  }

  show(text) {
    this.message = text;
    this.events.emit('message', { text });
  }

  update(dt) {
    this.input.update(dt);

    if (this.screen === 'title') {
      if (this.input.consume('menu') || this.input.consume('confirm') || this.input.consume('jump')) {
        this.startNew();
      }
      this.paint();
      this.input.endFrame();
      return;
    }

    if (this.screen === 'menu') {
      if (this.input.consume('menu')) this.closeMenu();
      else if (this.input.consume('map')) this.openMap();
      this.paint();
      this.input.endFrame();
      return;
    }

    if (this.screen === 'map') {
      if (this.input.consume('menu') || this.input.consume('map')) this.closeMap();
      this.paint();
      this.input.endFrame();
      return;
    }

    if (this.input.consume('menu')) {
      this.openMenu('status');
      this.input.endFrame();
      return;
    }
    if (this.input.consume('map')) {
      this.openMap();
      this.input.endFrame();
      return;
    }

    this.stamina.update(dt);
    const move = this.input.move();
    const dx = move.x;
    const dz = move.z;

    this.aiming = this.input.isDown('aim');
    this.locked = this.aiming;
    this.world.setLocked(this.locked);
    this.blocking = this.phase !== 'result' && !this.player.isDown
      && this.input.isDown('guard') && !this.playerCombat.invulnerable
      && !this.playerCombat.guardBroken;

    this.tutorial(dx, dz);

    if (this.phase !== 'result') {
      if (this.player.isDown) this.recoverPlayer();
      else this.movePlayer(dt, dx, dz);
      this.advanceTimers(dt);
      this.moveSensei(dt);
      this.advanceRound(dt);
    }

    this.playerCombat.tick(dt);
    this.poseFighters(dt);
    this.paint();
    this.input.endFrame();
  }

  tip({ pc, pad, touch }) {
    return this.input.device === 'touch' ? touch : this.input.device === 'gamepad' ? pad : pc;
  }

  tutorial(dx, dz) {
    if (this.phase !== 'tutorial') return;
    if (this.step === 0 && (dx || dz)) {
      this.step = 1;
      this.show(this.tip({
        pc: 'Step 2/4: staff attack with LMB or J.',
        pad: 'Step 2/4: staff attack with RT.',
        touch: 'Step 2/4: staff attack with the STAFF button.'
      }));
    }
    if (this.step === 1 && this.input.isDown('attack')) {
      this.step = 2;
      this.show(this.tip({
        pc: 'Step 3/4: hold RMB to aim and lock on.',
        pad: 'Step 3/4: hold LT to aim and lock on.',
        touch: 'Step 3/4: hold AIM on the right to lock on.'
      }));
    }
    if (this.step === 2 && this.input.consume('aim')) {
      this.step = 3;
      this.show(this.tip({
        pc: 'Step 4/4: guard with Q or K. Add a direction to dodge; time it to parry.',
        pad: 'Step 4/4: guard with B. Add a direction to dodge; time it to parry.',
        touch: 'Step 4/4: tap GUARD to block, add a direction to dodge, or time it to parry.'
      }));
    }
    if (this.step === 3 && (this.input.isDown('guard') || this.input.isDown('jump'))) {
      this.step = 4;
      this.show('Tutorial complete. Begin free spar, or skip at any time.');
    }
    if (this.step === 4 && (this.input.consume('confirm') || this.input.consume('interact'))) {
      this.finishTutorial();
    }
  }

  movePlayer(dt, dx, dz) {
    const player = this.world.player;
    const sensei = this.world.sensei;
    const sprinting = this.input.isDown('sprint') && !this.blocking
      && (dx || dz) && this.stamina.value > 0;
    if (sprinting) this.stamina.drain(CONFIG.sprintCost, dt);
    const speed = (sprinting ? CONFIG.sprint : CONFIG.move)
      * (this.blocking ? CONFIG.guardSpeed : 1);

    if (this.playerCombat.dodgeTimer > 0) {
      player.position.x += this.playerCombat.dodgeDir.x * CONFIG.dodgeSpeed * dt;
      player.position.z += this.playerCombat.dodgeDir.z * CONFIG.dodgeSpeed * dt;
    } else if (dx || dz) {
      // Analog: a half-tilted stick moves at half speed. Keyboard diagonals arrive normalized.
      player.position.x += dx * speed * dt;
      player.position.z += dz * speed * dt;
    }
    player.position.x = clamp(player.position.x);
    player.position.z = clamp(player.position.z);

    if (dx || dz) player.rotation.y = Math.atan2(dx, dz);
    if (this.locked) {
      player.rotation.y = Math.atan2(sensei.position.x - player.position.x, sensei.position.z - player.position.z);
    }

    this.crouching = this.input.isDown('crouch');

    if (this.input.consume('jump') && player.position.y <= 0.01 && this.stamina.spend(CONFIG.jumpCost)) {
      player.userData.vy = CONFIG.jump;
    }
    if (player.userData.vy) {
      player.position.y += player.userData.vy * dt;
      player.userData.vy -= CONFIG.gravity * dt;
      if (player.position.y < 0) { player.position.y = 0; player.userData.vy = 0; }
    }

    if (this.input.consume('guard')) {
      if ((dx || dz) && this.stamina.spend(CONFIG.dodgeCost)) {
        this.playerCombat.beginDodge(dx, dz, player.rotation.y);
        this.playerCombat.clearBlockPressure();
        this.events.emit('dodge');
      } else {
        this.playerCombat.beginGuard();
        this.events.emit('guard');
      }
    }

    if (this.input.consume('attack') && this.playerCombat.canAttack && !this.blocking) {
      this.playerCombat.beginAttack();
      this.events.emit('swing');
      const distance = player.position.distanceTo(sensei.position);
      if (this.phase === 'spar' && !this.sensei.isDown) {
        if (distance < CONFIG.range) {
          if (this.sensei.hit(CONFIG.damage) === KNOCKDOWN) {
            this.onKnockdown('player');
          } else {
            this.knockback(sensei, player, CONFIG.knockback);
            this.events.emit('hit', { target: 'sensei' });
          }
        } else {
          this.ai.noticeWhiff(distance);
          this.events.emit('whiff', { distance });
        }
      }
    }
  }

  recoverPlayer() {
    if (!this.player.awaitingConfirm) return;
    const wantsUp = this.input.consume('confirm') || this.input.consume('jump') || this.input.consume('interact');
    if (!wantsUp) return;
    this.player.confirm();
    this.resetPose(this.world.player);
    this.roundTimer = CONFIG.roundPause;
    this.show('You recover and rejoin practice.');
    this.events.emit('recover', { who: 'player' });
  }

  advanceTimers(dt) {
    this.player.tick(dt);
    if (this.sensei.tick(dt) === RECOVERED) {
      this.resetPose(this.world.sensei);
      this.roundTimer = CONFIG.roundPause;
      this.show('Sensei recovers and resumes sparring.');
      this.events.emit('recover', { who: 'sensei' });
    }
  }

  moveSensei(dt) {
    const player = this.world.player;
    const sensei = this.world.sensei;
    const vx = player.position.x - sensei.position.x;
    const vz = player.position.z - sensei.position.z;
    const distance = Math.hypot(vx, vz);
    const active = this.phase === 'spar' && !this.match.over;

    const intent = this.ai.update(dt, {
      active,
      senseiDown: this.sensei.isDown,
      playerDown: this.player.isDown,
      playerInvulnerable: this.playerCombat.invulnerable,
      distance
    });

    if (intent.approach && distance > 0.001) {
      sensei.position.x = clamp(sensei.position.x + vx / distance * CONFIG.senseiSpeed * dt);
      sensei.position.z = clamp(sensei.position.z + vz / distance * CONFIG.senseiSpeed * dt);
    }
    if (active && distance > 0.001) sensei.rotation.y = Math.atan2(vx, vz);

    if (intent.strike && !this.player.isDown) {
      if (this.playerCombat.parryReady) {
        this.playerCombat.consumeParry();
        this.playerCombat.clearBlockPressure();
        this.ai.stagger();
        this.knockback(sensei, player, CONFIG.knockback * 2);
        this.show('Parried. Sensei is open.');
        this.log.push('Parried — Sensei is open.', 'good');
        this.events.emit('parry');
        return;
      }
      const damage = this.blocking ? CONFIG.senseiDamage * CONFIG.blockDamageScale : CONFIG.senseiDamage;
      const result = this.player.hit(damage);
      this.knockback(player, sensei, CONFIG.knockback);
      if (result === KNOCKDOWN) {
        this.onKnockdown('sensei');
      } else if (result === HIT) {
        if (this.blocking && this.playerCombat.registerBlock()) {
          this.events.emit('block', { target: 'player' });
          this.events.emit('guard-break');
          this.log.push('Guard broken — give ground.', 'warn');
          this.show('Guard broken — give ground and reset.');
        } else {
          this.events.emit(this.blocking ? 'block' : 'hit', { target: 'player' });
        }
      }
    }
  }

  onKnockdown(scorer) {
    const ended = this.match.award(scorer);
    this.roundTimer = CONFIG.roundPause;
    this.events.emit('knockdown', { scorer, player: this.match.player, sensei: this.match.sensei });
    if (ended) {
      this.finishMatch();
    } else if (scorer === 'player') {
      this.log.push('Sensei down — +1 knockdown.', 'good');
      this.show('Sensei is down. He will recover shortly.');
    } else {
      this.log.push('Sensei scores a knockdown.', 'bad');
      this.show('Downed. Wait, then press A / Enter / confirm to get up.');
    }
  }

  finishMatch() {
    this.phase = 'result';
    this.resultText = this.match.winner === 'player' ? 'YOU WIN THE SPAR' : 'SENSEI WINS THE SPAR';
    this.skipVisible = false;
    this.restartVisible = true;
    this.show(`Spar complete — ${this.match.score}. Restart to spar again.`);
    this.log.push(this.match.winner === 'player' ? 'Spar won.' : 'Spar lost — Sensei takes it.', 'info');
    this.events.emit('match-end', { winner: this.match.winner });
    this.paint();
  }

  advanceRound(dt) {
    if (this.phase !== 'spar' || this.match.over || this.roundTimer <= 0) return;
    if (this.player.isDown || this.sensei.isDown) return;
    this.roundTimer -= dt;
    if (this.roundTimer > 0) return;
    this.startRound();
  }

  startRound() {
    this.roundTimer = 0;
    this.player.reset();
    this.sensei.reset();
    this.playerCombat.reset();
    this.ai.reset();
    this.resetFighters();
    this.show(`Spar — ${this.match.score}.`);
    this.events.emit('round-start', { player: this.match.player, sensei: this.match.sensei });
  }

  resetFighters() {
    for (const fighter of [this.world.player, this.world.sensei]) {
      fighter.rotation.set(0, 0, 0);
      fighter.scale.set(1, 1, 1);
      fighter.userData.vy = 0;
    }
    this.world.player.position.set(0, 0, START.player);
    this.world.sensei.position.set(0, 0, START.sensei);
  }

  resetPose(fighter) {
    fighter.rotation.z = 0;
    fighter.position.y = 0;
  }

  knockback(target, source, amount) {
    const dx = target.position.x - source.position.x;
    const dz = target.position.z - source.position.z;
    const length = Math.hypot(dx, dz) || 1;
    target.position.x = clamp(target.position.x + dx / length * amount);
    target.position.z = clamp(target.position.z + dz / length * amount);
  }

  poseFighters(dt) {
    const player = this.world.player;
    const sensei = this.world.sensei;
    if (this.player.isDown) {
      player.rotation.z = Math.PI / 2;
      player.position.y = -0.35;
    } else {
      player.rotation.z += (0 - player.rotation.z) * Math.min(1, dt * 8);
      if (!player.userData.vy) player.position.y += (0 - player.position.y) * Math.min(1, dt * 8);
    }
    if (this.sensei.isDown) {
      sensei.rotation.z = Math.PI / 2;
      sensei.position.y = -0.35;
    } else {
      sensei.rotation.z += (0 - sensei.rotation.z) * Math.min(1, dt * 8);
      sensei.position.y += (0 - sensei.position.y) * Math.min(1, dt * 8);
    }
    this.world.playerParts.stick.rotation.z = this.playerCombat.swingAngle;
  }

  paint() {
    const player = this.world.player;
    const sensei = this.world.sensei;
    this.hud.sync({
      phase: this.phase,
      playerHp: this.player.hp,
      senseiHp: this.sensei.hp,
      playerScore: this.match.player,
      senseiScore: this.match.sensei,
      needed: this.match.needed,
      warning: this.phase === 'spar' && this.ai.windingUp,
      message: this.message ?? '',
      prompt: this.phase === 'result'
        ? 'Spar complete — use RESTART PRACTICE to spar again.'
        : this.input.controlHints(this.phase, this.player.isDown),
      device: this.input.deviceLabel(),
      touch: this.input.device === 'touch',
      aiming: this.aiming,
      paused: this.screen !== 'playing',
      result: this.resultText,
      showSkip: this.skipVisible,
      showRestart: this.restartVisible,
      screen: this.screen,
      menuTab: this.menuTab,
      menuFrom: this.menuFrom,
      hasSave: this.hasSave,
      save: this.saveInfo,
      xp: this.progress.xp,
      cash: this.progress.cash,
      permissions: this.progress.permissions,
      tutorialDone: this.phase !== 'tutorial',
      stamina: this.stamina.ratio,
      sleeveAcquired: this.sleeveAcquired,
      feed: this.log.items,
      player: { x: player.position.x, z: player.position.z, yaw: player.rotation.y },
      sensei: { x: sensei.position.x, z: sensei.position.z },
      arena: CONFIG.arenaLimit
    });
  }
}
