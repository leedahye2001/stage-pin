import assert from 'node:assert/strict';
import test from 'node:test';
import { millisecondsUntilNextHour, popularSearchUpdateLabel } from '../src/lib/popular-search.ts';

test('popular ranking labels use Korean time, including midnight and noon', () => {
  assert.equal(popularSearchUpdateLabel('2026-10-29T09:00:00Z'), '오후 6시 업데이트');
  assert.equal(popularSearchUpdateLabel('2026-10-29T15:00:00Z'), '오전 12시 업데이트');
  assert.equal(popularSearchUpdateLabel('2026-10-29T03:00:00Z'), '오후 12시 업데이트');
});
test('refresh interval targets the next exact hour', () => {
  assert.equal(millisecondsUntilNextHour(Date.parse('2026-10-29T09:59:59Z')), 1000);
  assert.equal(millisecondsUntilNextHour(Date.parse('2026-10-29T10:00:00Z')), 3600000);
});
