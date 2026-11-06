import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFavorites, changeFavorite, writeForOwner } from '../src/lib/favorite-storage.ts';

const artist = { id: 'mbid:day6', name: 'DAY6', aliases: ['데이식스'] };
test('guest data survives parsing and toggles by stable ID without mutating old data', () => {
  const old = parseFavorites(JSON.stringify({ artists: [artist], concerts: [] }));
  assert.deepEqual(changeFavorite(old, 'ARTIST', artist).artists, []);
  assert.equal(old.artists.length, 1);
  assert.equal(changeFavorite(parseFavorites(null), 'ARTIST', artist).artists[0].id, artist.id);
  assert.throws(() => parseFavorites('{bad'));
  assert.throws(() => parseFavorites('{"artists":[null],"concerts":[]}'));
});
test('late write from previous member cannot populate another account or guest state', async () => {
  let owner = 'A'; let applied = false; let finish;
  const pending = writeForOwner('A', () => owner, () => new Promise(resolve => { finish = resolve; }), () => { applied = true; });
  owner = 'B'; finish({ artists: [artist], concerts: [] }); await pending;
  assert.equal(applied, false);
  let called = false;
  await writeForOwner('A', () => null, async () => { called = true; }, () => {});
  assert.equal(called, false);
});
test('save failure does not apply or pretend to be an empty successful list', async () => {
  let applied = false;
  await assert.rejects(writeForOwner('A', () => 'A', async () => { throw new Error('offline'); }, () => { applied = true; }), /offline/);
  assert.equal(applied, false);
});
