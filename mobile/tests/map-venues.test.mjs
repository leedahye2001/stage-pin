import assert from 'node:assert/strict';
import test from 'node:test';
import { mapVenues } from '../src/lib/map-venues.ts';

test('groups venue shows and removes duplicate records', () => {
  const venue = { id: 'arena', name: '공연장', latitude: 37.5, longitude: 127 };
  const first = { id: 'first', venue };
  const second = { id: 'second', venue };
  const other = { id: 'third', venue: { ...venue, id: 'other' } };
  assert.deepEqual(mapVenues([first, second, first, other]).map(group => group.concerts.map(show => show.id)), [['first', 'second'], ['third']]);
});

test('rejects invalid coordinates and groups venues without IDs', () => {
  const show = { id: 'a', venue: { name: '공연장', latitude: 37.5, longitude: 127 } };
  const invalid = [NaN, undefined, 91, null].map(latitude => ({ ...show, venue: { ...show.venue, latitude } }));
  invalid.push({ ...show, venue: { ...show.venue, longitude: 181 } }, { ...show, venue: { ...show.venue, latitude: 0, longitude: 0 } });
  assert.equal(mapVenues(invalid).length, 0);
  assert.equal(mapVenues([show, { ...show, id: 'b' }])[0].concerts.length, 2);
  assert.deepEqual(mapVenues([]), []);
});
