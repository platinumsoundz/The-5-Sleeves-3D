import test from 'node:test';
import assert from 'node:assert/strict';
import { installGuildBridge, GUILD_BRIDGE_CHANNEL, GUILD_BRIDGE_VERSION } from '../src/guild-bridge.js';

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
  const game = { paused: false, resetCount: 0, paintCount: 0, input: { reset() { game.resetCount += 1; } }, paint() { game.paintCount += 1; } };
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
  assert.equal(h.game.resetCount, 0);
});

test('pauses and restores the prior game pause state without touching saves', () => {
  const h = harness();
  installGuildBridge(h);
  h.dispatch({ source: h.windowRef.parent, origin: 'https://guild.example', data: command('pause') });
  assert.equal(h.game.paused, true);
  assert.equal(h.game.resetCount, 1);
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
