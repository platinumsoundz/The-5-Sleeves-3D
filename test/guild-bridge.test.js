import test from 'node:test';
import assert from 'node:assert/strict';
import { installGuildBridge, GUILD_BRIDGE_CHANNEL, GUILD_BRIDGE_VERSION } from '../src/guild-bridge.js';
import { Input } from '../src/input.js';

function harness(referrer = 'https://guild.example/games') {
  const listeners = new Map();
  const sent = [];
  const parent = { postMessage: (message, targetOrigin) => sent.push({ message, targetOrigin }) };
  const windowRef = {
    parent,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name)
  };
  const documentRef = { referrer };
  const game = { paused: false, releaseCount: 0, paintCount: 0, input: { releaseAll() { game.releaseCount += 1; } }, paint() { game.paintCount += 1; } };
  return { windowRef, documentRef, game, sent, dispatch(event) { listeners.get('message')?.(event); }, listeners };
}

const command = value => ({ channel: GUILD_BRIDGE_CHANNEL, version: GUILD_BRIDGE_VERSION, command: value, requestId: 'test-1' });

test('announces readiness only to the embedding Guild origin', () => {
  const h = harness();
  const cleanup = installGuildBridge(h);
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0].message.type, 'ready');
  assert.equal(h.sent[0].targetOrigin, 'https://guild.example');
  cleanup();
  assert.equal(h.listeners.has('message'), false);
});

test('ignores messages from a different source or origin', () => {
  const h = harness();
  installGuildBridge(h);
  h.dispatch({ source: {}, origin: 'https://guild.example', data: command('pause') });
  h.dispatch({ source: h.windowRef.parent, origin: 'https://attacker.example', data: command('pause') });
  assert.equal(h.game.paused, false);
  assert.equal(h.game.releaseCount, 0);
});

test('pauses and restores the prior game pause state without touching saves', () => {
  const h = harness();
  installGuildBridge(h);
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('pause') });
  assert.equal(h.game.paused, true);
  assert.equal(h.game.releaseCount, 1);
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('resume') });
  assert.equal(h.game.paused, false);
  assert.equal(h.game.paintCount, 1);
  assert.equal(h.sent.at(-1).message.type, 'ack');
  assert.equal(h.sent.at(-1).message.requestId, 'test-1');
});

test('does not resume a game that was already paused before the Guild overlay', () => {
  const h = harness();
  h.game.paused = true;
  installGuildBridge(h);
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('pause') });
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('resume') });
  assert.equal(h.game.paused, true);
  assert.equal(h.game.paintCount, 0);
});

test('does not activate when opened directly without a parent referrer', () => {
  const h = harness('');
  installGuildBridge(h);
  assert.equal(h.sent.length, 0);
  assert.equal(h.listeners.size, 0);
});


test('ignores malformed versions and unsupported commands', () => {
  const h = harness();
  installGuildBridge(h);
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: { ...command('pause'), version: 2 } });
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('grant-dlc') });
  assert.equal(h.game.paused, false);
  assert.equal(h.game.releaseCount, 0);
});

test('repeated pause commands release input only once until resumed', () => {
  const h = harness();
  installGuildBridge(h);
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('pause') });
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('pause') });
  assert.equal(h.game.releaseCount, 1);
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('resume') });
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('resume') });
  assert.equal(h.game.paused, false);
  assert.equal(h.game.paintCount, 1);
});


test('releaseAll clears every held input source', () => {
  const input = Object.create(Input.prototype);
  input.held = new Set(['forward', 'attack']);
  input.pressed = new Set(['jump']);
  input.padHeld = new Set(['guard']);
  input.padMove = { x: 0.8, z: -0.6 };
  input.look = { x: 0.5, y: -0.2 };
  input.stick = { pointerId: 7, x: 0.9, y: 0.4, magnitude: 1 };
  input.stickKnob = { style: { transform: 'translate(20px, 10px)' } };
  input.pointerStart = { x: 100, y: 200 };
  input.pointerActions = new Map([[7, 'attack']]);
  input.releaseAll();
  assert.equal(input.held.size, 0);
  assert.equal(input.pressed.size, 0);
  assert.equal(input.padHeld.size, 0);
  assert.deepEqual(input.padMove, { x: 0, z: 0 });
  assert.deepEqual(input.look, { x: 0, y: 0 });
  assert.deepEqual(input.stick, { pointerId: null, x: 0, y: 0, magnitude: 0 });
  assert.equal(input.stickKnob.style.transform, '');
  assert.equal(input.pointerStart, null);
  assert.equal(input.pointerActions.size, 0);
});
