import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.endsWith('/home-discovery.ts') && specifier.startsWith('./') ? `${specifier}.ts` : specifier, context);
} });
const { discoveryConcerts, upcomingOpenings, homeConcertAudience } = await import('../src/lib/home-discovery.ts');
const now = Date.parse('2026-11-05T06:00:00Z');
const show = { id:'a', source:'KOPIS', status:'UPCOMING', startsAt:'2026-11-06T10:00:00+09:00', endsAt:null };

test('home always offers public discovery unless the current member has loaded artist favorites', () => {
  assert.equal(homeConcertAudience(undefined, true, 4), 'public'); // Guest device favorites do not hide public discovery.
  assert.equal(homeConcertAudience(undefined, false, 0), 'public');
  assert.equal(homeConcertAudience('member', false, 4), 'public');
  assert.equal(homeConcertAudience('member', true, 0), 'public');
  assert.equal(homeConcertAudience('member', true, 2), 'following');
  assert.equal(homeConcertAudience(undefined, true, 2), 'public'); // Logout with stale favorites.
});

test('first visit discovers real upcoming/ongoing shows without favorites and excludes archives', () => {
  const ongoing = { ...show,id:'ongoing',startsAt:'2026-11-04T00:00:00+09:00',endsAt:'2026-11-05T00:00:00+09:00' };
  const hidden = [{ ...show,id:'past',status:'COMPLETED' }, { ...show,id:'cancel',status:'CANCELLED' },
    { ...show,id:'demo',source:'DEMO' }, { ...show,id:'bad',startsAt:'bad' }, { ...show,id:'bad-end',endsAt:'bad' }, { ...show,id:'reversed',endsAt:'2026-11-05T00:00:00Z' }];
  assert.deepEqual(discoveryConcerts([show, ...hidden, ongoing, show], now).map(item=>item.id), ['ongoing','a']);
  assert.deepEqual(discoveryConcerts([], now), []);
});

test('ticket discovery only shows future verified openings with safe source/ticket links, nearest first', () => {
  const opening = { id:'one', type:'GENERAL_SALE', opensAt:'2026-11-07T20:00:00+09:00', verifiedAt:'2026-11-01T00:00:00Z', ticketUrl:'https://ticket.example.com/1', sourceUrl:'https://official.example.com/1' };
  const sooner = { ...opening,id:'soon',type:'FAN_PRESALE',opensAt:'2026-11-06T20:00:00+09:00' };
  const hidden = [{...opening,id:'past',opensAt:'2026-11-04T20:00:00+09:00'}, {...opening,id:'unverified',verifiedAt:''},
    {...opening,id:'show',type:'SHOW'}, {...opening,id:'script',ticketUrl:'javascript:alert(1)'}, {...opening,id:'bad-source',sourceUrl:'bad'}];
  assert.deepEqual(upcomingOpenings([opening,...hidden,sooner,opening],now).map(item=>item.id),['soon','one']);
  assert.deepEqual(upcomingOpenings([],now),[]);
});
