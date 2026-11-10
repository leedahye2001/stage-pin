import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
registerHooks({ resolve(specifier, context, next) {
  return next(context.parentURL?.endsWith('/goods-listings.ts') && specifier.startsWith('./') ? `${specifier}.ts` : specifier, context);
} });
const { goodsMetadata, goodsItem } = await import('../src/lib/goods-listings.ts');

const draft = { artist: '데이식스', title: '포토카드', kind: '판매', price: '12000', wanted: '', condition: 'SEALED',
  photos: [{ uri: 'file:///photo.jpg', width: 200, height: 200, mimeType: 'image/jpeg' }],
  description: '설명', onsite: false, delivery: true, event: '' };

test('metadata contains validated codes and no client-controlled owner or photo URI', () => {
  const data = goodsMetadata(draft, 'request-1');
  assert.equal(data.requestId, 'request-1');
  assert.equal(data.artist, 'DAY6');
  assert.equal(data.kind, 'SALE');
  assert.equal(data.price, '12000');
  assert.equal(data.conditionCode, 'SEALED');
  assert.equal(data.ownerId, undefined);
  assert.equal(data.photos, undefined);
  assert.equal(data.seller, undefined);
  for (const change of [{ price: '1.5' }, { condition: 'good' }, { photos: [] }, { event: 'x'.repeat(201) }, { description: 'x'.repeat(1001) }]) {
    assert.throws(() => goodsMetadata({ ...draft, ...change }, 'request-1'));
  }
});

test('exchange metadata has no sale price and preserves onsite event and wanted goods', () => {
  const data = goodsMetadata({ ...draft, kind: '교환', wanted: '원필 포카', onsite: true, event: 'DAY6 공연' }, 'request-2');
  assert.equal(data.kind, 'EXCHANGE');
  assert.equal(data.price, null);
  assert.equal(data.wanted, '원필 포카');
  assert.equal(data.event, 'DAY6 공연');
});

test('reloaded server data uses server owner, permanent image URL and stored price/condition', () => {
  const data = { id: 'server-id', ownerId: 'member-id', seller: '실제 닉네임', artist: 'DAY6', title: '포카', kind: 'SALE',
    price: 12000, wanted: '', conditionCode: 'OPENED_UNUSED', description: '설명', onsite: false, delivery: true,
    event: null, createdAt: '2026-11-05T06:00:00Z', photos: [{ id: 'photo-id', url: '/api/v1/goods/photos/photo-id', width: 300, height: 200 }] };
  const item = goodsItem(JSON.parse(JSON.stringify(data)), 'http://localhost:8080');
  assert.equal(item.ownerId, 'member-id');
  assert.equal(item.seller, '실제 닉네임');
  assert.equal(item.price, 12000);
  assert.equal(item.condition, '개봉, 미사용');
  assert.equal(item.photos[0].uri, 'http://localhost:8080/api/v1/goods/photos/photo-id');
  assert.equal(goodsItem(data, '').photos[0].uri, '/api/v1/goods/photos/photo-id');
});
