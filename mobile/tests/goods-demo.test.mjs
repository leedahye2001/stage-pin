import assert from 'node:assert/strict';
import test from 'node:test';
import { demoGoods, demoArtists, filterDemoGoods, goodsPrice, createDemoListing } from '../src/lib/goods-demo.ts';

test('demo goods have unique IDs and valid exchange/sales data', () => {
  assert.equal(new Set(demoGoods.map((item) => item.id)).size, demoGoods.length);
  for (const item of demoGoods) {
    assert.ok(demoArtists.some((artist) => artist.name === item.artist));
    assert.ok(item.methods.length > 0);
    if (item.kind === '교환') { assert.equal(item.price, null); assert.ok(item.wanted); }
    else { assert.ok(item.price > 0); assert.equal(item.wanted, ''); }
  }
});

test('goods filters combine artist, trade type and case/space-insensitive keyword', () => {
  assert.equal(filterDemoGoods(demoGoods, '전체', '전체', '').length, demoGoods.length);
  assert.deepEqual(filterDemoGoods(demoGoods, 'SEVENTEEN', '교환', '민 규').map((item) => item.id), ['demo-svt-1']);
  assert.deepEqual(filterDemoGoods(demoGoods, '전체', '전체', 'young k').map((item) => item.id), ['demo-day6-1']);
  assert.deepEqual(filterDemoGoods(demoGoods, '전체', '전체', '데이식스').map((item) => item.id), ['demo-day6-1']);
  assert.deepEqual(filterDemoGoods(demoGoods, '전체', '전체', '방탄').map((item) => item.id), ['demo-bts-1']);
  assert.equal(filterDemoGoods(demoGoods, 'IVE', '판매', 'nonexistent').length, 0);
  assert.ok(filterDemoGoods(demoGoods, '전체', '판매', '').every((item) => item.kind === '판매'));
});

test('exchange labels never display a null price', () => {
  assert.equal(goodsPrice(demoGoods[0]), '교환해요');
  assert.equal(goodsPrice(demoGoods[1]), '8,000원');
});

test('local listings validate sale price, exchange requirements and onsite performance', () => {
  const draft = { artist: '데이식스', title: '테스트 포카', kind: '판매', price: '8000', wanted: '', condition: '미개봉', description: '샘플', onsite: false, delivery: true, event: '' };
  const sale = createDemoListing(draft, 'local-test');
  assert.equal(sale.artist, 'DAY6');
  assert.equal(sale.price, 8000);
  assert.equal(sale.id, 'local-test');
  for (const price of ['0', '-1', '1.5', 'NaN', '1e4', '100000001']) assert.throws(() => createDemoListing({ ...draft, price }, 'bad'));
  assert.throws(() => createDemoListing({ ...draft, title: ' ' }, 'bad'));
  assert.throws(() => createDemoListing({ ...draft, kind: '교환' }, 'bad'));
  assert.throws(() => createDemoListing({ ...draft, delivery: false }, 'bad'));
  assert.throws(() => createDemoListing({ ...draft, onsite: true }, 'bad'));
  const exchange = createDemoListing({ ...draft, kind: '교환', wanted: '원필 포카', onsite: true, event: 'DAY6 공연' }, 'local-exchange');
  assert.equal(exchange.price, null);
  assert.deepEqual(filterDemoGoods([sale, exchange], '전체', '교환', '', true), [exchange]);
});
