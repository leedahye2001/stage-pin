import assert from 'node:assert/strict';
import test from 'node:test';
import { artistConcertKeywords, homeConcerts } from '../src/lib/home-concerts.ts';

test('home only shows favorite artists, removes ended shows and sorts by date', () => {
  const now = Date.parse('2026-10-28T00:00:00Z');
  const concert = { id: 'late', source: 'KOPIS', status: 'UPCOMING', startsAt: '2026-11-10T00:00:00Z', endsAt: null, artists: [{ name: '데이식스' }] };
  const early = { ...concert, id: 'early', startsAt: '2026-10-29T00:00:00Z', artists: [{ name: 'IVE' }] };
  const invalid = [{ ...concert, source: 'DEMO' }, { ...concert, status: 'CANCELLED' }, { ...concert, status: 'COMPLETED' }, { ...concert, startsAt: '2026-10-01T00:00:00Z' }];
  const items = [concert, early, ...invalid];
  const favorites = [{ name: 'DAY6', searchName: 'DAY6', aliases: ['데이식스'] }];
  assert.deepEqual(homeConcerts(items, favorites, now).map((item) => item.id), ['late']);
  assert.equal(homeConcerts(items, [], now).length, 0);
  assert.equal(homeConcerts([{ ...concert, startsAt: '2026-10-27T00:00:00Z', endsAt: '2026-10-30T00:00:00Z' }], favorites, now).length, 1);
  assert.deepEqual(homeConcerts([concert, {...early, artists: concert.artists}], favorites, now).map(item => item.id), ['early', 'late']);
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
