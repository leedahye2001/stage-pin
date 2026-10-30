import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
// Metro resolves extensionless TS imports; give this isolated Node test the same resolution.
registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.endsWith('/map-discovery.ts') && specifier.startsWith('./') ? `${specifier}.ts` : specifier, context);
} });
const { discoverVenues, distanceKm } = await import('../src/lib/map-discovery.ts');

const venue = { id: 'seoul', name: '올림픽공원', city: '서울특별시', address: '서울 송파구', latitude: 37.52, longitude: 127.12 };
const show = { id: 'a', title: 'DAY6 live', artists: [{ name: 'DAY6' }], venue, startsAt: '2026-10-30T11:00:00Z', endsAt: null, status: 'UPCOMING' };
const options = { query: '', period: 'all', city: '', favoritesOnly: false, favoriteIds: [], location: null, now: Date.parse('2026-10-29T15:30:00Z') };
const ids = groups => groups.flatMap(group => group.concerts.map(item => item.id));

test('searches loaded venue, address, artist aliases and concert titles', () => {
  for (const query of ['송파', '올림픽', 'day 6', '데이식스']) assert.deepEqual(ids(discoverVenues([show], { ...options, query })), ['a']);
  assert.deepEqual(discoverVenues([show], { ...options, query: '없는 장소' }), []);
});
test('combines favorites and city filters, deduplicates records and rejects invalid coordinates', () => {
  assert.deepEqual(ids(discoverVenues([show, show, { ...show, id: 'bad', venue: { ...venue, latitude: NaN } }], { ...options, favoritesOnly: true, favoriteIds: ['a'], city: venue.city })), ['a']);
  assert.deepEqual(discoverVenues([show], { ...options, favoritesOnly: true }), []);
  assert.deepEqual(discoverVenues([show], { ...options, city: '부산광역시' }), []);
});
test('period filters use Seoul calendar days, include ongoing shows, exclude cancellation and invalid dates', () => {
  const ongoing = { ...show, id: 'ongoing', startsAt: '2026-10-28T00:00:00Z', endsAt: '2026-10-30T12:00:00Z' };
  const tomorrow = { ...show, id: 'tomorrow', startsAt: '2026-10-31T00:00:00Z' };
  const nextMonth = { ...show, id: 'nov', startsAt: '2026-11-02T00:00:00Z' };
  const items = [show, ongoing, tomorrow, nextMonth, { ...show, id: 'cancel', status: 'CANCELLED' }, { ...show, id: 'bad', startsAt: 'bad' }];
  assert.deepEqual(ids(discoverVenues(items, { ...options, period: 'today' })), ['ongoing', 'a']);
  assert.deepEqual(ids(discoverVenues(items, { ...options, period: 'month' })), ['ongoing', 'a', 'tomorrow']);
  assert.deepEqual(ids(discoverVenues(items, { ...options, period: 'week' })), ['ongoing', 'a', 'tomorrow', 'nov']);
});
test('distance order is based on received location only, never invented distances', () => {
  const busan = { ...show, id: 'b', venue: { ...venue, id: 'busan', name: '부산 공연장', latitude: 35.18, longitude: 129.07 } };
  assert.equal(distanceKm(venue, venue), 0);
  const seoulDistance = distanceKm(venue, busan.venue);
  assert.ok(seoulDistance > 300 && seoulDistance < 350);
  assert.equal(discoverVenues([show], options)[0].distance, null);
  assert.deepEqual(discoverVenues([busan, show], { ...options, location: venue }).map(group => group.key), ['seoul', 'busan']);
});
