// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Every DOM write lives here so Game stays testable without a document. Elements are injected,
// never queried, and optional ones (score, result) are tolerated for older shells.
export class Hud {
  constructor(elements) { this.el = elements; }

  sync(state) {
    const el = this.el;
    el.phase.textContent = state.phase === 'spar' ? 'FREE SPAR'
      : state.phase === 'result' ? 'SPAR COMPLETE' : 'TUTORIAL';
    if (el.score) el.score.textContent = `${state.playerScore} — ${state.senseiScore}`;
    el.playerHealth.style.width = `${percent(state.playerHp)}%`;
    el.senseiHealth.style.width = `${percent(state.senseiHp)}%`;
    el.message.textContent = state.message;
    el.prompt.textContent = state.prompt;
    el.device.textContent = state.device;
    el.touchControls.hidden = !state.touch;
    el.skip.hidden = !state.showSkip;
    el.restart.hidden = !state.showRestart;
    if (el.result) {
      el.result.hidden = !state.result;
      el.result.textContent = state.result || '';
    }
  }
}

function percent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
