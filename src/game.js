// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
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
    this.resetFighters();
    this.input.reset();
    this.show('Step 1/4: move with WASD / stick / direction pad. Sensei is passive.');
    this.paint();
    this.events.emit('reset');
  }

  finishTutorial() {
    if (this.phase !== 'tutorial') return;
    this.phase = 'spar';
    this.skipVisible = false;
    this.restartVisible = true;
    this.show(`Free spar: first to ${this.match.needed} knockdowns wins. Sensei recovers on his own.`);
    this.events.emit('tutorial-end');
    this.paint();
  }

  show(text) {
    this.message = text;
    this.events.emit('message', { text });
  }

  update(dt) {
    this.input.update(dt);
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

  tutorial(dx, dz) {
    if (this.phase !== 'tutorial') return;
    if (this.step === 0 && (dx || dz)) {
      this.step = 1;
      this.show('Step 2/4: staff attack with LMB / RT.');
    }
    if (this.step === 1 && this.input.isDown('attack')) {
      this.step = 2;
      this.show('Step 3/4: hold aim to lock on with RMB / LT / AIM.');
    }
    if (this.step === 2 && this.input.consume('aim')) {
      this.step = 3;
      this.show('Step 4/4: guard with K / B. Add a direction to dodge; time it to parry.');
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
    const speed = (this.input.isDown('sprint') ? CONFIG.sprint : CONFIG.move)
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

    player.scale.y = this.input.isDown('crouch') ? 0.68 : 1;

    if (this.input.consume('jump') && player.position.y <= 0.01) player.userData.vy = CONFIG.jump;
    if (player.userData.vy) {
      player.position.y += player.userData.vy * dt;
      player.userData.vy -= CONFIG.gravity * dt;
      if (player.position.y < 0) { player.position.y = 0; player.userData.vy = 0; }
    }

    if (this.input.consume('guard')) {
      if (dx || dz) {
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
      this.show('Sensei is down. He will recover shortly.');
    } else {
      this.show('Downed. Wait, then press A / Enter / confirm to get up.');
    }
  }

  finishMatch() {
    this.phase = 'result';
    this.resultText = this.match.winner === 'player' ? 'YOU WIN THE SPAR' : 'SENSEI WINS THE SPAR';
    this.skipVisible = false;
    this.restartVisible = true;
    this.show(`Spar complete — ${this.match.score}. Restart to spar again.`);
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
      result: this.resultText,
      showSkip: this.skipVisible,
      showRestart: this.restartVisible
    });
  }
}
