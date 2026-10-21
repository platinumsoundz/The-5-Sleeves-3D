// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Every DOM write lives here so Game stays testable without a document. Elements are injected,
// never queried, and optional ones (score, result) are tolerated for older shells.
export class Hud {
  constructor(elements) { this.el = elements; }

  sync(state) {
    const el = this.el;
    el.phase.textContent = state.phase === 'spar' ? 'FREE SPAR'
      : state.phase === 'result' ? 'SPAR COMPLETE' : 'TUTORIAL';
    if (el.score) el.score.textContent = pips(state);
    el.playerHealth.style.width = `${percent(state.playerHp)}%`;
    el.senseiHealth.style.width = `${percent(state.senseiHp)}%`;
    if (el.warning) el.warning.hidden = !state.warning;
    el.message.textContent = state.message;
    el.prompt.textContent = state.prompt;
    el.device.textContent = state.device;
    el.touchControls.hidden = !state.touch || state.paused;
    el.touchControls.classList?.toggle('aiming', state.aiming);
    if (el.reticle) el.reticle.hidden = !state.aiming || state.paused;
    // While aiming, touch players get a fire button under the left thumb too.
    if (el.fire) el.fire.hidden = !(state.touch && state.aiming) || state.paused;
    if (el.pause) el.pause.hidden = state.paused || state.phase === 'result';
    if (el.settings) el.settings.hidden = !state.paused;
    el.skip.hidden = !state.showSkip || state.paused;
    el.restart.hidden = !state.showRestart || state.paused;
    if (el.result) {
      el.result.hidden = !state.result;
      el.result.textContent = state.result || '';
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
