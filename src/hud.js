// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21 (shell/save/hud pass)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (sleeve HUD gating)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (weapons/wilderness slice)
// Every DOM write lives here so Game stays testable without a document. Elements are injected,
// never queried, and optional ones are tolerated for older shells.
import { radarOffset } from './radar.js';

export class Hud {
  constructor(elements) { this.el = elements; }

  sync(state) {
    const el = this.el;
    const screen = state.screen || 'playing';
    const playing = screen === 'playing';

    el.phase.textContent = state.phase === 'spar' ? 'FREE SPAR'
      : state.phase === 'result' ? 'SPAR COMPLETE'
        : state.phase === 'wilds' ? 'WILDERNESS' : 'TUTORIAL';
    if (el.targetName) el.targetName.textContent = state.targetName || 'SENSEI';
    if (el.score) {
      el.score.textContent = pips(state);
      el.score.hidden = state.zone === 'wilds';
    }
    if (el.weapon) {
      el.weapon.textContent = state.weaponShort || 'STAFF';
      el.weapon.classList?.toggle('test', state.weaponTest === true);
      el.weapon.classList?.toggle('unarmed', state.weapon === 'unarmed');
    }
    if (el.zone) el.zone.textContent = state.zone === 'wilds' ? 'WILDERNESS' : 'TRAINING YARD';
    el.playerHealth.style.width = `${percent(state.playerHp)}%`;
    el.senseiHealth.style.width = `${percent(state.senseiHp)}%`;
    if (el.playerStamina) el.playerStamina.style.width = `${percent(state.stamina * 100)}%`;
    if (el.sleeveVital) el.sleeveVital.hidden = !state.sleeveAcquired;
    if (el.sleeveCharge && state.sleeveAcquired) {
      el.sleeveCharge.style.width = Number.isFinite(state.sleeve)
        ? `${percent(state.sleeve * 100)}%`
        : '0%';
    }
    if (el.warning) el.warning.hidden = !state.warning || !playing;
    el.message.textContent = state.message;
    el.prompt.textContent = state.prompt;
    if (el.sleeveVital) el.sleeveVital.classList?.toggle('test', state.weaponTest === true);
    el.device.textContent = state.device;

    if (el.hud) el.hud.hidden = screen === 'title';
    if (el.title) el.title.hidden = screen !== 'title';
    if (el.menuResume) el.menuResume.textContent = state.menuFrom === 'title' ? 'BACK' : 'RESUME';
    if (el.settings) el.settings.hidden = screen !== 'menu';
    if (el.mapScreen) el.mapScreen.hidden = screen !== 'map';
    if (el.resume) {
      el.resume.disabled = !state.hasSave;
      el.resume.setAttribute?.('aria-disabled', String(!state.hasSave));
    }
    if (el.pause) el.pause.hidden = !playing || state.phase === 'result';
    el.skip.hidden = !state.showSkip || !playing;
    el.restart.hidden = !state.showRestart || !playing;
    if (el.result) {
      el.result.hidden = !state.result || !playing;
      el.result.textContent = state.result || '';
    }

    el.touchControls.hidden = !state.touch || !playing;
    el.touchControls.classList?.toggle('aiming', state.aiming);
    if (el.reticle) el.reticle.hidden = !state.aiming || !playing;
    if (el.fire) el.fire.hidden = !(state.touch && state.aiming) || !playing;

    // Radar: the player sits at the centre facing up; Sensei is projected relative to them.
    if (el.radarSensei && state.player && state.sensei) {
      el.radarSensei.hidden = state.zone === 'wilds';
      const spot = radarOffset(state.player, state.player.yaw, state.sensei, state.arena || 6, 40);
      el.radarSensei.style.transform = `translate(${spot.x}px, ${spot.y}px)`;
      el.radarSensei.classList?.toggle('off', spot.clamped);
    }

    if (el.radarEnemies) {
      el.radarEnemies.forEach((node, index) => {
        const enemy = state.enemies?.[index];
        const show = state.zone === 'wilds' && enemy && enemy.alive;
        node.hidden = !show;
        if (!show) return;
        const spot = radarOffset(state.player, state.player.yaw, enemy, 24, 40);
        node.style.transform = `translate(${spot.x}px, ${spot.y}px)`;
        node.classList?.toggle('off', spot.clamped);
      });
    }

    // Larger maps stay north-up so the training ground is easy to read.
    if (el.mapPlayers || el.mapSenseis) {
      const place = (node, point) => {
        const x = 50 + (point.x / (state.arena || 6)) * 42;
        // North is negative z (the gate and tower lie up-screen), so flip the depth axis.
        const y = 50 + (point.z / (state.arena || 6)) * 42;
        node.style.left = `${x}%`;
        node.style.top = `${y}%`;
      };
      for (const node of el.mapPlayers || []) place(node, state.player);
      for (const node of el.mapSenseis || []) place(node, state.sensei);
      for (const [index, node] of (el.mapEnemies || []).entries()) {
        const enemy = state.enemies?.[index];
        node.hidden = !enemy || !enemy.alive;
        if (enemy) place(node, enemy);
      }
    }

    if (el.feedLines) {
      const entries = state.feed || [];
      const start = Math.max(0, entries.length - el.feedLines.length);
      el.feedLines.forEach((line, index) => {
        const entry = entries[start + index];
        line.hidden = !entry;
        line.textContent = entry ? entry.text : '';
        line.className = `feed-line${entry ? ` ${entry.kind}` : ''}`;
      });
    }

    if (el.menuPages) {
      for (const [tab, node] of Object.entries(el.menuPages)) node.hidden = tab !== state.menuTab;
    }
    for (const tab of el.menuTabs || []) {
      tab.classList?.toggle('active', tab.dataset?.tab === state.menuTab);
    }

    if (el.statXp) el.statXp.textContent = String(state.xp ?? 0);
    if (el.statCash) el.statCash.textContent = String(state.cash ?? 0);
    if (el.statTutorial) el.statTutorial.textContent = state.tutorialDone ? 'Complete' : 'In progress';
    if (el.statScore) el.statScore.textContent = `${state.playerScore} – ${state.senseiScore}`;
    if (el.statPerms) {
      el.statPerms.textContent = state.permissions?.length
        ? state.permissions.join(', ')
        : 'None (developer codes can grant these)';
    }
    if (el.saveStatus) {
      el.saveStatus.textContent = state.hasSave
        ? `Save slot: spar ${state.tutorialDone ? 'unlocked' : 'not started'}`
        : 'No save in this browser yet.';
    }
  }
}

function percent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// Filled dots for knockdowns scored, hollow dots for the ones still needed.
function pips(state) {
  const mark = score => '●'.repeat(score) + '○'.repeat(Math.max(0, state.needed - score));
  return `${mark(state.playerScore)} — ${mark(state.senseiScore)}`;
}
