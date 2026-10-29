import assert from 'node:assert/strict';
import test from 'node:test';
import { artistConcertKeywords, concertArtistNames, concertPhase, homeConcerts } from '../src/lib/home-concerts.ts';

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
