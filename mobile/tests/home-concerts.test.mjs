import assert from 'node:assert/strict';
import test from 'node:test';
import { artistConcertKeywords, concertArtistNames, concertPhase, concertVendors, homeConcerts, popularArtists, vendorConcertCandidates } from '../src/lib/home-concerts.ts';

test('home includes favorite artist history, orders ongoing/upcoming/history, excludes cancelled and demo shows', () => {
  const now = Date.parse('2026-10-28T00:00:00Z');
  const concert = { id: 'late', source: 'KOPIS', status: 'UPCOMING', startsAt: '2026-11-10T00:00:00Z', endsAt: null, artists: [{ name: '데이식스' }] };
  const early = { ...concert, id: 'early', startsAt: '2026-10-29T00:00:00Z', artists: [{ name: 'IVE' }] };
  const completed = { ...concert, id: 'completed', status: 'COMPLETED', startsAt: '2026-07-03T03:00:00Z' };
  const old = { ...completed, id: 'old', startsAt: '2025-12-19T03:00:00Z' };
  const ongoing = { ...concert, id: 'ongoing', startsAt: '2026-10-27T03:00:00Z', endsAt: '2026-10-30T03:00:00Z' };
  const invalid = [{ ...concert, source: 'DEMO' }, { ...concert, status: 'CANCELLED' }];
  const items = [old, concert, early, completed, ongoing, ...invalid];
  const favorites = [{ name: 'DAY6', searchName: 'DAY6', aliases: ['데이식스'] }];
  assert.deepEqual(homeConcerts(items, favorites, now).map((item) => item.id), ['ongoing', 'late', 'completed', 'old']);
  assert.equal(homeConcerts(items, [], now).length, 0);
  assert.equal(homeConcerts([{ ...concert, startsAt: '2026-10-27T00:00:00Z', endsAt: '2026-10-30T00:00:00Z' }], favorites, now).length, 1);
  assert.deepEqual(homeConcerts([concert, {...early, artists: concert.artists}], favorites, now).map(item => item.id), ['early', 'late']);
});

test('status badges respect explicit states and Seoul date boundaries for KOPIS', () => {
  const show = { source: 'KOPIS', status: 'ON_SALE', startsAt: '2026-10-29T03:00:00Z', endsAt: '2026-10-30T03:00:00Z' };
  assert.equal(concertPhase(show, Date.parse('2026-10-28T14:59:59Z')), '예정');
  assert.equal(concertPhase(show, Date.parse('2026-10-28T15:00:00Z')), '진행 중');
  assert.equal(concertPhase(show, Date.parse('2026-10-30T14:59:59Z')), '진행 중');
  assert.equal(concertPhase(show, Date.parse('2026-10-30T15:00:00Z')), '완료');
  assert.equal(concertPhase({ ...show, endsAt: null }, Date.parse('2026-10-29T14:59:59Z')), '진행 중');
  assert.equal(concertPhase({ ...show, endsAt: null }, Date.parse('2026-10-29T15:00:00Z')), '완료');
  assert.equal(concertPhase({ ...show, status: 'COMPLETED' }, Date.parse('2026-10-28T00:00:00Z')), '완료');
  assert.equal(concertPhase({ ...show, status: 'CANCELLED' }, Date.parse('2026-10-31T00:00:00Z')), '취소');
  assert.equal(concertPhase({ ...show, source: 'STAGEPIN' }, Date.parse('2026-10-29T02:59:59Z')), '예정');
  assert.equal(concertPhase({ ...show, source: 'STAGEPIN' }, Date.parse('2026-10-29T03:00:00Z')), '진행 중');
});

test('matches artist names in titles when KOPIS has no cast, without matching IVE inside LIVE', () => {
  const now = Date.parse('2026-10-28T00:00:00Z');
  const base = {source: 'KOPIS', status: 'UPCOMING', startsAt: '2026-11-01T00:00:00Z', artists: []};
  const favorites = [{name:'IVE', searchName:'IVE', aliases:['아이브']}, {name:'DAY6', searchName:'DAY6', aliases:['데이식스']}];
  const items = ['LIVE CONCERT', 'IVE FANCON', '아이브팬미팅', 'DAY 6 CONCERT', '데이식스 콘서트'].map((title,id)=>({...base,title,id:String(id)}));
  assert.deepEqual(homeConcerts(items,favorites,now).map(item=>item.id), ['1','2','3','4']);
});

test('deduplicates repeated API results and accepts published StagePin records, not demos', () => {
  const now = Date.parse('2026-10-28T00:00:00Z');
  const item = {id:'show',title:'DAY6 공연',source:'KOPIS',status:'UPCOMING',startsAt:'2026-11-01T00:00:00Z',artists:[]};
  const favorites = [{name:'DAY6',searchName:'DAY6',aliases:[]}];
  assert.deepEqual(homeConcerts([item,item,{...item,id:'registered',source:'STAGEPIN'},{...item,id:'demo',source:'DEMO'}],favorites,now).map(item=>item.id),['show','registered']);
});

test('bounds query variants to primary names and one Korean alias per artist', () => {
  assert.deepEqual(artistConcertKeywords([{name:'DAY6',searchName:'Day 6',aliases:['데이식스','데이 식스','デイシックス']}]),['DAY6','데이식스']);
  assert.deepEqual(artistConcertKeywords([]),[]);
});

test('detail prefers actual cast and only supplements missing cast with matching known profiles', () => {
  const artists = [{name:'DAY6',searchName:'DAY6',aliases:['데이식스']}, {name:'IVE',searchName:'IVE',aliases:['아이브']}];
  assert.equal(concertArtistNames({title:'DAY6 10th Anniversary Tour',artists:[]},artists),'DAY6');
  assert.equal(concertArtistNames({title:'데이식스 콘서트',artists:[]},artists),'DAY6');
  assert.equal(concertArtistNames({title:'DAY 6 CONCERT',artists:[]},artists),'DAY6');
  assert.equal(concertArtistNames({title:'LIVE MUSIC',artists:[]},artists),'');
  assert.equal(concertArtistNames({title:'DAY6 CONCERT',artists:[{name:'실제 출연진'}]},artists),'실제 출연진');
  assert.equal(concertArtistNames({title:'DAY6 CONCERT',artists:[]},[]),'');
  assert.equal(concertArtistNames({title:'DAY6 CONCERT',artists:[{name:' '}]},artists),'DAY6');
});

test('editorial vendor candidates cover all six artists, two each, without duplicates or unrelated titles', () => {
  const now = Date.parse('2026-10-29T00:00:00Z');
  const base = {source:'KOPIS',status:'COMPLETED',artists:[],endsAt:null,ticketLinks:[]};
  const shows = popularArtists.flatMap(artist => [1,2,3].map(day => ({...base,id:`${artist.id}-${day}`,title:`${artist.name} CONCERT`,startsAt:`2026-07-0${day}T03:00:00Z`})));
  const items = vendorConcertCandidates([...shows,shows[0],{...shows[0],id:'unrelated',title:'LIVE NIGHT'}],now);
  assert.equal(items.length,12);
  assert.equal(new Set(items.map(item=>item.id)).size,12);
  assert.equal(items.some(item=>item.id==='unrelated'),false);
  assert.equal(items.every(item=>!item.id.endsWith('-1')),true);
  assert.deepEqual(vendorConcertCandidates([],now),[]);
});

test('ticket vendors are derived from actual URL hostnames, never titles or spoofed domain text', () => {
  const links = urls => ({ticketLinks: urls.map(url=>({name:'NOL',url}))});
  assert.deepEqual(concertVendors(links(['https://tickets.interpark.com/goods/123','https://nol.yanolja.com/ticket/products/123','http://ticket.yes24.com/Perf/123','https://ticket.melon.com/performance/123','https://www.ticketlink.co.kr/product/123'])),['NOL','YES24','MELON','TICKETLINK']);
  assert.deepEqual(concertVendors(links(['https://ticket.yes24.com.evil.test/123','https://example.org/?url=yes24.com'])),['OTHER']);
  assert.deepEqual(concertVendors(links(['javascript:alert(1)','not a url'])),[]);
  assert.deepEqual(concertVendors(links([])),[]);
});
