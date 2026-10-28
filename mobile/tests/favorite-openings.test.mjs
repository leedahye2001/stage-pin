import assert from 'node:assert/strict';
import test from 'node:test';
import { favoriteOpenings } from '../src/lib/favorite-openings.ts';

test('favorite artist schedules match Korean/English aliases, not unrelated substrings', () => {
  const artists = [{ name: 'DAY6', searchName: 'DAY6', aliases: ['데이식스'] }, { name: 'IVE', searchName: 'IVE', aliases: ['아이브'] }];
  const openings = ['데이식스', 'day 6', 'IVE', 'LIVE BAND', 'DAY6 tribute', 'DAY6 / aespa'].map((artistName) => ({ artistName }));
  assert.deepEqual(favoriteOpenings(openings, artists).map((item) => item.artistName), ['데이식스', 'day 6', 'IVE', 'DAY6 / aespa']);
  assert.deepEqual(favoriteOpenings(openings, []), []);
  assert.equal(favoriteOpenings(openings, [artists[1]]).length, 1);
});
