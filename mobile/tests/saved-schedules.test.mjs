import assert from 'node:assert/strict';
import test from 'node:test';
import { calendarDays, concertScheduleOptions, mergeSchedules, moveMonth, openingSchedule, parseSavedSchedules, schedulesForDay, seoulDay } from '../src/lib/saved-schedules.ts';

const concert = { id: 'concert-1', title: 'DAY6 LIVE', source: 'KOPIS', status: 'UPCOMING',
  genre: 'POPULAR_MUSIC', artists: [{ id: 'artist-1', name: 'DAY6', imageUrl: null }],
  startsAt: '2026-11-14T15:00:00Z', endsAt: '2026-11-16T15:00:00Z', officialUrl: 'https://www.kopis.or.kr/detail',
  venue: { name: '공연장' }, ticketLinks: [{ name: 'YES24', url: 'https://ticket.yes24.com/performance/1' }] };
const opening = { id: 'opening-1', concertId: null, concertTitle: 'DAY6 LIVE', artistName: 'DAY6',
  opensAt: '2026-11-02T11:00:00Z', type: 'FAN_PRESALE', timezone: 'Asia/Seoul', vendor: 'YES24',
  ticketUrl: 'https://ticket.yes24.com/performance/1', sourceUrl: 'https://example.com/notice', verifiedAt: '2026-10-28T01:00:00Z' };

test('calendar handles Seoul date boundaries, month offsets and leap years', () => {
  assert.equal(seoulDay('2026-11-14T15:00:00Z'), '2026-11-15');
  assert.equal(seoulDay('2026-11-14T14:59:59Z'), '2026-11-14');
  const february = calendarDays('2028-02');
  assert.equal(february.filter(Boolean).length, 29);
  assert.equal(february.length % 7, 0);
  assert.ok(february.includes('2028-02-29'));
  assert.equal(calendarDays('2026-11')[0], '2026-11-01');
  assert.equal(moveMonth('2026-12', 1), '2027-01');
  assert.equal(moveMonth('2026-01', -1), '2025-12');
});

test('only verified presale/general-sale dates with safe links can be saved', () => {
  const item = openingSchedule(opening);
  assert.equal(item.type, 'FAN_PRESALE');
  assert.equal(item.attending, false);
  assert.equal(item.dateOnly, false);
  for (const invalid of [{ type: 'SHOW' }, { opensAt: 'unknown' }, { verifiedAt: '' }, { ticketUrl: 'javascript:alert(1)' }, { sourceUrl: '' }]) {
    assert.equal(openingSchedule({ ...opening, ...invalid }), null);
  }
});

test('detail offers a date-only performance and conservatively matched ticket dates, not fabricated dates', () => {
  const options = concertScheduleOptions(concert, [opening, { ...opening, id: 'other', concertTitle: 'DAY6 OTHER LIVE' },
    { ...opening, id: 'wrong-artist', artistName: 'OTHER' }, { ...opening, id: 'wrong-id', concertId: 'different-concert' }]);
  assert.equal(options.length, 2);
  assert.equal(options[0].type, 'SHOW');
  assert.equal(options[0].dateOnly, true);
  assert.equal(options[0].attending, false);
  assert.equal(concertScheduleOptions(concert, []).length, 1);
  assert.deepEqual(concertScheduleOptions({ ...concert, source: 'DEMO' }, [opening]), []);
  assert.deepEqual(concertScheduleOptions({ ...concert, status: 'CANCELLED' }, []), []);
  assert.deepEqual(concertScheduleOptions({ ...concert, endsAt: 'broken' }, []), []);
  assert.equal(concertScheduleOptions({ ...concert, genre: 'MUSICAL' }, [opening])[1].genre, 'MUSICAL');
  assert.equal(concertScheduleOptions(concert, [{ ...opening, concertId: concert.id, concertTitle: '다른 표기', artistName: '다른 표기' }]).length, 2);
});

test('saving repeatedly preserves manual attendance without creating duplicates; restored data retains dates', () => {
  const [show] = concertScheduleOptions(concert, []);
  const saved = mergeSchedules([{ ...show, attending: true }], [show, openingSchedule(opening)]);
  assert.equal(saved.length, 2);
  assert.equal(saved.find((item) => item.id === show.id).attending, true);
  assert.deepEqual(parseSavedSchedules(JSON.stringify(saved)), saved);
  assert.deepEqual(parseSavedSchedules(null), []);
  assert.throws(() => parseSavedSchedules('{}'));
  assert.throws(() => parseSavedSchedules(JSON.stringify([{ ...show, startsAt: 'broken' }])));
  assert.throws(() => parseSavedSchedules(JSON.stringify([{ ...show, sourceUrl: 'javascript:alert(1)' }])));
  assert.throws(() => parseSavedSchedules(JSON.stringify([{ ...openingSchedule(opening), attending: true }])));
});

test('selected date and filters use actual saved entries, not favorite artists or sample data', () => {
  const options = concertScheduleOptions(concert, [opening]);
  assert.equal(schedulesForDay(options, '2026-11-15', 'SHOW').length, 1);
  assert.equal(schedulesForDay(options, '2026-11-15', 'TICKET').length, 0);
  assert.equal(schedulesForDay(options, '2026-11-02', 'TICKET').length, 1);
  assert.deepEqual(schedulesForDay(options, '2026-11-03', 'ALL'), []);
});
