import assert from 'node:assert/strict';
import test from 'node:test';
import { authApiBase, loginCallbackError, parseNativeCallback } from '../src/lib/auth-helpers.ts';

test('production web uses same-origin cookie proxy while native/local use configured API', () => {
  assert.equal(authApiBase('web', 'stage-pin.vercel.app', 'https://api.example.com'), '');
  assert.equal(authApiBase('web', 'localhost', 'http://localhost:8080'), 'http://localhost:8080');
  assert.equal(authApiBase('ios', '', 'https://api.example.com'), 'https://api.example.com');
});
test('native login accepts only its exact registered callback', () => {
  assert.deepEqual(parseNativeCallback('stagepin://auth/callback?code=abc'), { code: 'abc', error: null });
  for (const url of ['https://evil.example.com/auth/callback?code=a', 'stagepin://evil/callback', 'stagepin://auth/other']) assert.throws(() => parseNativeCallback(url));
});
test('cancel and provider errors do not expose provider details', () => {
  assert.match(loginCallbackError('cancelled'), /취소/);
  assert.equal(loginCallbackError('private-provider-error'), loginCallbackError(null));
});
