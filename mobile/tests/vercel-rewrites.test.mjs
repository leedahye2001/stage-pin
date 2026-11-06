import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const { rewrites } = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

test('account favorites proxy preserves collection paths before SPA fallback', () => {
  const exact = rewrites.findIndex(rule => rule.source === '/api/v1/favorites');
  const nested = rewrites.findIndex(rule => rule.source === '/api/v1/favorites/:path*');
  assert.ok(exact >= 0 && nested > exact);
  assert.equal(rewrites[exact].destination, 'https://stage-pin-api.onrender.com/api/v1/favorites');
  assert.equal(rewrites[nested].destination, 'https://stage-pin-api.onrender.com/api/v1/favorites/:path*');
  assert.ok(rewrites.findIndex(rule => rule.source === '/(.*)') > nested);
});

test('goods collection uses an exact proxy before wildcard so GET/POST do not gain a trailing slash', () => {
  const exact = rewrites.findIndex(rule => rule.source === '/api/v1/goods');
  const nested = rewrites.findIndex(rule => rule.source === '/api/v1/goods/:path*');
  assert.ok(exact >= 0 && nested > exact);
  assert.equal(rewrites[exact].destination, 'https://stage-pin-api.onrender.com/api/v1/goods');
  assert.equal(rewrites[nested].destination, 'https://stage-pin-api.onrender.com/api/v1/goods/:path*');
  assert.ok(rewrites.findIndex(rule => rule.source === '/(.*)') > nested);
});
