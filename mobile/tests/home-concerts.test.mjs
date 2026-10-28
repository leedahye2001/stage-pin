import assert from 'node:assert/strict';
import test from 'node:test';
import { homeConcerts } from '../src/lib/home-concerts.ts';

test('home shows real, non-ended performances in date order and respects favorite aliases', () => {
  const now = Date.parse('2026-10-28T00:00:00Z');
  const concert = { id: 'late', source: 'KOPIS', status: 'UPCOMING', startsAt: '2026-11-10T00:00:00Z', endsAt: null, artists: [{ name: '데이식스' }] };
  const early = { ...concert, id: 'early', startsAt: '2026-10-29T00:00:00Z', artists: [{ name: 'IVE' }] };
  const invalid = [{ ...concert, source: 'DEMO' }, { ...concert, status: 'CANCELLED' }, { ...concert, status: 'COMPLETED' }, { ...concert, startsAt: '2026-10-01T00:00:00Z' }];
  const items = [concert, early, ...invalid];
  assert.deepEqual(homeConcerts(items, [], false, now).map((item) => item.id), ['early', 'late']);
  assert.deepEqual(homeConcerts(items, [{ name: 'DAY6', searchName: 'DAY6', aliases: ['데이식스'] }], true, now).map((item) => item.id), ['late']);
  assert.equal(homeConcerts(items, [], true, now).length, 0);
  assert.equal(homeConcerts([{ ...concert, startsAt: '2026-10-27T00:00:00Z', endsAt: '2026-10-30T00:00:00Z' }], [], false, now).length, 1);
});
