// Entry point: scene creation and browser input live in separate, small modules.
import { createWorld } from './world.js';
import { Game } from './game.js';
import { Input } from './input.js';

const world = createWorld(document.querySelector('#game'));
const input = new Input();
const game = new Game(world, input, {
  prompt: document.querySelector('#prompt'), message: document.querySelector('#message'),
  phase: document.querySelector('#phase'), playerHealth: document.querySelector('#player-health'),
  senseiHealth: document.querySelector('#sensei-health'), result: document.querySelector('#result'),
  skip: document.querySelector('#skip'), restart: document.querySelector('#restart'), device: document.querySelector('#device'), loading: document.querySelector('#loading')
});
let previous = performance.now();
function frame(now) {
  const dt = Math.min((now - previous) / 1000, 0.05); previous = now;
  game.update(dt); world.render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
