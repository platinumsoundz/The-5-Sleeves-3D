// Versioned, non-sensitive lifecycle bridge for the Guild embedded player.
// This deliberately exposes no save data, account identity, wallet or purchase API.
export const GUILD_BRIDGE_CHANNEL = 'guild.5-sleeves';
export const GUILD_BRIDGE_VERSION = 1;

export function installGuildBridge({ windowRef, documentRef, game }) {
  let parentOrigin = '';
  try {
    parentOrigin = new URL(documentRef.referrer).origin;
  } catch {
    return () => {};
  }
  if (!parentOrigin || windowRef.parent === windowRef) return () => {};

  let pausedBeforeHost = null;
  const send = (type, extra = {}) => {
    windowRef.parent.postMessage({
      channel: GUILD_BRIDGE_CHANNEL,
      version: GUILD_BRIDGE_VERSION,
      game: 'the-5-sleeves-3d',
      type,
      ...extra
    }, parentOrigin);
  };

  const onMessage = event => {
    if (event.source !== windowRef.parent || event.origin !== parentOrigin) return;
    const message = event.data;
    if (!message || message.channel !== GUILD_BRIDGE_CHANNEL || message.version !== GUILD_BRIDGE_VERSION) return;
    if (message.command === 'pause') {
      if (pausedBeforeHost === null) pausedBeforeHost = Boolean(game.paused);
      game.paused = true;
      game.input?.reset?.();
      send('ack', { command: 'pause', requestId: message.requestId ?? null });
      return;
    }
    if (message.command === 'resume') {
      if (pausedBeforeHost !== null) {
        game.paused = pausedBeforeHost;
        if (!pausedBeforeHost) game.paint?.();
        pausedBeforeHost = null;
      }
      send('ack', { command: 'resume', requestId: message.requestId ?? null });
    }
  };

  windowRef.addEventListener('message', onMessage);
  send('ready');
  return () => windowRef.removeEventListener('message', onMessage);
}
