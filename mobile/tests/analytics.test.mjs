import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsPageUrl } from '../src/lib/analytics.ts';

test('web analytics keeps page paths but removes search terms and fragments', () => {
  assert.equal(analyticsPageUrl('https://stage-pin.vercel.app/search?query=DAY6#results'), 'https://stage-pin.vercel.app/search');
  assert.equal(analyticsPageUrl('https://stage-pin.vercel.app/goods'), 'https://stage-pin.vercel.app/goods');
});

test('web analytics excludes admin, local, preview and invalid URLs', () => {
  for (const url of ['https://stage-pin.vercel.app/admin/notices', 'http://localhost:8081/',
    'https://stage-pin-preview.vercel.app/', 'http://stage-pin.vercel.app/', 'invalid']) {
    assert.equal(analyticsPageUrl(url), null);
  }
});
