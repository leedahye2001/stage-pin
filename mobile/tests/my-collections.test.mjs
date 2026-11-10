import test from 'node:test';
import assert from 'node:assert/strict';
import { collectionViewState, memberCollections, myCollections } from '../src/lib/my-collections.ts';

const base = { authPending: false, requiresLogin: false, hasItems: false, pending: false, failed: false };
test('MY hides every private section while signed out, resolving auth or failing auth even with stale member data', () => {
  assert.deepEqual(memberCollections(undefined, false), []);
  assert.deepEqual(memberCollections(undefined, true), []);
  assert.deepEqual(memberCollections('stale-member', true), []);
  assert.deepEqual(memberCollections('member', false), myCollections);
});
test('MY distinguishes auth loading, login required, failure and a genuinely empty list', () => {
  assert.equal(collectionViewState({ ...base, authPending: true, requiresLogin: true }), 'loading');
  assert.equal(collectionViewState({ ...base, requiresLogin: true, pending: true }), 'login');
  assert.equal(collectionViewState({ ...base, failed: true, pending: true }), 'error');
  assert.equal(collectionViewState({ ...base, pending: true }), 'loading');
  assert.equal(collectionViewState(base), 'empty');
});
test('cached content stays visible during background refetch and failure', () => {
  assert.equal(collectionViewState({ ...base, hasItems: true, pending: true }), 'content');
  assert.equal(collectionViewState({ ...base, hasItems: true, failed: true }), 'content');
});
test('vertical MY sections keep their order and matching row loading shapes', () => {
  assert.deepEqual(myCollections.map(item => item.label), ['찜한 공연', '관심 아티스트', '내 등록 굿즈', '찜한 굿즈']);
  assert.deepEqual(myCollections.map(item => item.skeleton), ['concerts', 'artists', 'goods', 'goods']);
  assert.equal(new Set(myCollections.map(item => item.id)).size, 4);
});
