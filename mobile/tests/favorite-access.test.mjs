import test from 'node:test';
import assert from 'node:assert/strict';
import { favoriteWriteOwner } from '../src/lib/favorite-access.ts';

test('all favorite writers send signed-out, unresolved and failed sessions to login without a writer', () => {
  let redirects = 0;
  const login = () => redirects++;
  assert.equal(favoriteWriteOwner(undefined, false, login), undefined);
  assert.equal(favoriteWriteOwner(undefined, true, login), undefined);
  assert.equal(favoriteWriteOwner('stale-member', true, login), undefined);
  assert.equal(redirects, 3);
  assert.equal(favoriteWriteOwner('member', false, login), 'member');
  assert.equal(redirects, 3);
});
