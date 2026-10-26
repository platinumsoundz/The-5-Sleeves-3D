import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteSave, emptySave, loadSave, SAVE_BACKUP_KEY, SAVE_KEY, writeSave } from '../src/save.js';

function storageWith(entries = {}) {
  const data = new Map(Object.entries(entries));
  return {
    data,
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); }
  };
}

test('save recovery loads the backup when the primary JSON is corrupt', () => {
  const backup = { ...emptySave(), tutorialDone: true, progression: { level: 4, xp: 25, cash: 90 } };
  const storage = storageWith({
    [SAVE_KEY]: '{"version":',
    [SAVE_BACKUP_KEY]: JSON.stringify(backup)
  });

  const recovered = loadSave(storage);
  assert.equal(recovered.tutorialDone, true);
  assert.equal(recovered.progression.level, 4);
  assert.equal(recovered.progression.cash, 90);
});

test('saving rotates a valid primary snapshot into the backup before replacing it', () => {
  const previous = { ...emptySave(), progression: { level: 3, xp: 15, cash: 40 } };
  const storage = storageWith({ [SAVE_KEY]: JSON.stringify(previous) });
  const next = { ...previous, progression: { level: 5, xp: 10, cash: 120 } };

  writeSave(storage, next);
  assert.equal(JSON.parse(storage.getItem(SAVE_BACKUP_KEY)).progression.level, 3);
  assert.equal(JSON.parse(storage.getItem(SAVE_KEY)).progression.level, 5);
});

test('a malformed primary never overwrites an existing good backup', () => {
  const backup = { ...emptySave(), progression: { level: 2, xp: 5, cash: 10 } };
  const storage = storageWith({
    [SAVE_KEY]: '{broken',
    [SAVE_BACKUP_KEY]: JSON.stringify(backup)
  });

  writeSave(storage, { ...emptySave(), progression: { level: 6, xp: 0, cash: 250 } });
  assert.equal(JSON.parse(storage.getItem(SAVE_BACKUP_KEY)).progression.level, 2);
});

test('deleting a save clears both the primary and recovery copy', () => {
  const storage = storageWith({ [SAVE_KEY]: '{}', [SAVE_BACKUP_KEY]: '{}' });
  deleteSave(storage);
  assert.equal(loadSave(storage), null);
  assert.equal(storage.getItem(SAVE_KEY), null);
  assert.equal(storage.getItem(SAVE_BACKUP_KEY), null);
});
