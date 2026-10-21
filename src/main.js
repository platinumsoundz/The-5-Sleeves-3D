// ai: opencode/deepseek-v4.1-flash-free — 2026-10-21
// Entry point: scene creation and browser input live in separate, small modules.
import { createWorld } from './world.js';
import { Game } from './game.js';
import { Input } from './input.js';

const world = createWorld(document.querySelector('#game'));
const input = new Input();
const game = new Game(world, input, {
  prompt: document.querySelector('#prompt'), message: document.querySelector('#message'),
  phase: document.querySelector('#phase'), score: document.querySelector('#score'), playerHealth: document.querySelector('#player-health'),
  senseiHealth: document.querySelector('#sensei-health'), result: document.querySelector('#result'),
  skip: document.querySelector('#skip'), restart: document.querySelector('#restart'), device: document.querySelector('#device'),
  warning: document.querySelector('#warning'), touchControls: document.querySelector('#touch-controls'), loading: document.querySelector('#loading')
});
window.__trainingReady = true;

// Presentation subscribes to gameplay events instead of reaching into rules modules.
game.events.on('hit', ({ target }) => world.pulse(target, 0xff6b4a));
game.events.on('parry', () => world.pulse('sensei', 0x7fe6ff));
game.events.on('block', () => world.pulse('player', 0x7fe6ff));

const fpsLabel = document.querySelector('#fps');
let previous = performance.now();
let sampleFrames = 0;
let sampleTime = 0;

function frame(now) {
  const elapsed = Math.max(0, (now - previous) / 1000);
  previous = now;
  const dt = Math.min(elapsed, 0.05);
  if (!document.hidden) {
    game.update(dt);
    world.setFeedback({ senseiWindingUp: game.ai.windingUp, playerBlocking: game.blocking });
    world.render(dt);
    sampleFrames += 1;
    sampleTime += elapsed;
    if (sampleTime >= 0.5) {
      if (fpsLabel) fpsLabel.textContent = `${Math.round(sampleFrames / sampleTime)} FPS`;
      sampleFrames = 0;
      sampleTime = 0;
    }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
