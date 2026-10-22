// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (multiplayer-ready client scaffolding)
// Transport-agnostic lobby, party and chat state for a future co-op mode. This module is NOT
// imported by story mode: it has no DOM, renderer or network code. A future transport adapter
// feeds server events into the receive* methods and sends drained outbox messages over its wire
// protocol. All text is bounded and sanitized here so presentation can render it with textContent.
export const MP_LIMITS = Object.freeze({
  partySize: 4,
  chatHistory: 60,
  chatLength: 240,
  nameLength: 24,
  idLength: 40,
  lobbyNameLength: 32
});

export const MP_STATUS = Object.freeze({
  OFFLINE: 'offline',
  CONNECTING: 'connecting',
  ONLINE: 'online'
});

const cleanId = value => {
  const text = String(value ?? '').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, MP_LIMITS.idLength);
  return text;
};

const cleanName = value => {
  const text = String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MP_LIMITS.nameLength);
  return text;
};

const cleanChat = value => String(value ?? '')
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, MP_LIMITS.chatLength);

const now = () => Date.now();

export class MultiplayerClient {
  constructor(profile = {}) {
    this.reset(profile);
  }

  reset(profile = {}) {
    this.status = MP_STATUS.OFFLINE;
    this.local = {
      id: cleanId(profile.id) || 'local',
      name: cleanName(profile.name) || 'SLEEVE'
    };
    this.lobby = null;
    this.members = new Map();
    this.party = [];
    this.leader = '';
    this.chat = [];
    this.outbox = [];
    this.lastError = '';
    this.nextMessageId = 1;
    return this;
  }

  get online() {
    return this.status === MP_STATUS.ONLINE;
  }

  get partySize() {
    return this.party.length;
  }

  get isLeader() {
    return this.leader === this.local.id;
  }

  // Request a connection. The transport adapter owns the actual socket; it should call
  // markConnected() on success and markDisconnected() on failure or close.
  requestConnect() {
    if (this.status === MP_STATUS.ONLINE) return true;
    this.status = MP_STATUS.CONNECTING;
    this.outbox.push({
      type: 'hello',
      from: this.local.id,
      name: this.local.name,
      at: now()
    });
    return true;
  }

  markConnected() {
    this.status = MP_STATUS.ONLINE;
    this.lastError = '';
    return true;
  }

  markDisconnected(reason = '') {
    this.status = MP_STATUS.OFFLINE;
    this.lobby = null;
    this.members.clear();
    this.party = [];
    this.leader = '';
    this.chat = [];
    this.outbox = [];
    this.lastError = cleanChat(reason).slice(0, 80);
    return this;
  }

  joinLobby({ id, name } = {}) {
    if (!this.online) {
      this.lastError = 'Not connected.';
      return false;
    }
    const lobbyId = cleanId(id);
    if (!lobbyId) {
      this.lastError = 'A lobby id is required.';
      return false;
    }
    this.lobby = { id: lobbyId, name: cleanName(name) || 'OPEN LOBBY' };
    this.members.set(this.local.id, {
      id: this.local.id,
      name: this.local.name,
      ready: false,
      local: true
    });
    this.party = [];
    this.leader = '';
    this.chat = [];
    this.lastError = '';
    this.outbox.push({ type: 'join', lobby: lobbyId, from: this.local.id, at: now() });
    return true;
  }

  leaveLobby() {
    if (!this.lobby) return false;
    this.outbox.push({ type: 'leave', lobby: this.lobby.id, from: this.local.id, at: now() });
    this.lobby = null;
    this.members.clear();
    this.party = [];
    this.leader = '';
    this.chat = [];
    this.lastError = '';
    return true;
  }

  // Presence event from the transport. The local member is never replaced by a remote frame.
  addMember(member = {}) {
    if (!this.lobby) return false;
    const id = cleanId(member.id);
    if (!id || id === this.local.id) return false;
    if (this.members.has(id)) return false;
    this.members.set(id, {
      id,
      name: cleanName(member.name) || 'SLEEVE',
      ready: member.ready === true,
      local: false
    });
    return true;
  }

  removeMember(id) {
    const memberId = cleanId(id);
    if (!memberId || memberId === this.local.id || !this.members.has(memberId)) return false;
    this.members.delete(memberId);
    this.party = this.party.filter(entry => entry !== memberId);
    if (this.leader === memberId) this.leader = this.party[0] || '';
    return true;
  }

  setLocalReady(ready) {
    if (!this.lobby) return false;
    const local = this.members.get(this.local.id);
    if (!local) return false;
    local.ready = ready === true;
    this.outbox.push({ type: 'ready', from: this.local.id, ready: local.ready, at: now() });
    return true;
  }

  setMemberReady(id, ready) {
    const memberId = cleanId(id);
    const member = this.members.get(memberId);
    if (!member || member.local) return false;
    member.ready = ready === true;
    return true;
  }

  inviteToParty(id) {
    if (!this.lobby) {
      this.lastError = 'Join a lobby first.';
      return false;
    }
    if (this.leader && !this.isLeader) {
      this.lastError = 'Only the party leader can invite.';
      return false;
    }
    const memberId = cleanId(id);
    const member = this.members.get(memberId);
    if (!member || member.local) {
      this.lastError = 'That player is not in the lobby.';
      return false;
    }
    if (this.party.includes(memberId)) {
      this.lastError = 'That player is already in the party.';
      return false;
    }
    if (this.party.length >= MP_LIMITS.partySize) {
      this.lastError = 'The party is full.';
      return false;
    }
    if (!this.leader) this.leader = this.local.id;
    this.lastError = '';
    this.outbox.push({
      type: 'party-invite',
      from: this.local.id,
      to: memberId,
      lobby: this.lobby.id,
      at: now()
    });
    return true;
  }

  // Called by the transport when an invited player accepts. The local player can also accept a
  // remote invitation by passing the inviter/leader id.
  acceptPartyInvite(id, { lead = false } = {}) {
    if (!this.lobby) return false;
    const memberId = cleanId(id);
    const member = this.members.get(memberId);
    if (!member) return false;
    if (!this.party.includes(this.local.id)) this.party.unshift(this.local.id);
    if (!this.party.includes(memberId)) {
      if (this.party.length >= MP_LIMITS.partySize) {
        this.lastError = 'The party is full.';
        return false;
      }
      this.party.push(memberId);
    }
    if (!this.leader) this.leader = lead ? memberId : this.local.id;
    this.lastError = '';
    return true;
  }

  leaveParty() {
    if (!this.party.length) return false;
    this.outbox.push({ type: 'party-leave', from: this.local.id, at: now() });
    this.party = [];
    this.leader = '';
    this.lastError = '';
    return true;
  }

  sendChat(text) {
    if (!this.lobby) {
      this.lastError = 'Join a lobby first.';
      return null;
    }
    const body = cleanChat(text);
    if (!body) {
      this.lastError = 'Message is empty.';
      return null;
    }
    const message = {
      id: `m${this.nextMessageId++}`,
      type: 'chat',
      from: this.local.id,
      name: this.local.name,
      text: body,
      at: now()
    };
    this.appendChat(message);
    this.outbox.push({ ...message });
    this.lastError = '';
    return { ...message };
  }

  // Transport event for an incoming chat message. Unknown senders still get a bounded message, but
  // their display name is never trusted for anything except textContent rendering.
  receiveChat(payload = {}) {
    if (!this.lobby) return null;
    const text = cleanChat(payload.text);
    if (!text) return null;
    const member = this.members.get(cleanId(payload.from));
    const message = {
      id: cleanId(payload.id) || `m${this.nextMessageId++}`,
      type: 'chat',
      from: cleanId(payload.from) || 'remote',
      name: member?.name || cleanName(payload.name) || 'SLEEVE',
      text,
      at: Number.isFinite(payload.at) ? Math.max(0, Math.floor(payload.at)) : now()
    };
    this.appendChat(message);
    return { ...message };
  }

  addSystemMessage(text) {
    const body = cleanChat(text);
    if (!body) return null;
    const message = {
      id: `m${this.nextMessageId++}`,
      type: 'system',
      from: 'system',
      name: 'SYSTEM',
      text: body,
      at: now()
    };
    this.appendChat(message);
    return { ...message };
  }

  appendChat(message) {
    this.chat.push(message);
    if (this.chat.length > MP_LIMITS.chatHistory) {
      this.chat.splice(0, this.chat.length - MP_LIMITS.chatHistory);
    }
  }

  drainOutbox() {
    const messages = this.outbox.map(message => ({ ...message }));
    this.outbox = [];
    return messages;
  }

  partyMembers() {
    return this.party
      .map(id => this.members.get(id))
      .filter(Boolean)
      .map(member => ({ ...member }));
  }

  snapshot() {
    return {
      status: this.status,
      local: { ...this.local },
      lobby: this.lobby ? { ...this.lobby } : null,
      members: [...this.members.values()].map(member => ({ ...member })),
      party: this.partyMembers(),
      leader: this.leader,
      chat: this.chat.map(message => ({ ...message })),
      lastError: this.lastError
    };
  }
}

export function createMultiplayerClient(profile = {}) {
  return new MultiplayerClient(profile);
}
