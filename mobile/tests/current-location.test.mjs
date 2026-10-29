import assert from 'node:assert/strict';
import test from 'node:test';
import { requestCurrentLocation } from '../src/lib/current-location.ts';

test('requests a single location with a timeout, returning coordinates only', async () => {
  let options;
  const location = await requestCurrentLocation({ getCurrentPosition(success, failure, config) {
    options = config;
    success({ coords: { latitude: 37.5, longitude: 127, accuracy: 50 } });
  } });
  assert.deepEqual(location, { latitude: 37.5, longitude: 127 });
  assert.equal(options.timeout, 10000);
  assert.equal(options.enableHighAccuracy, false);
});

test('reports unsupported browsers, denied permission, timeout and invalid locations', async () => {
  await assert.rejects(requestCurrentLocation(undefined), /지원하지/);
  for (const [code, message] of [[1, /권한/], [2, /위치 설정/], [3, /초과/]]) {
    await assert.rejects(requestCurrentLocation({ getCurrentPosition(success, failure) { failure({ code }); } }), message);
  }
  await assert.rejects(requestCurrentLocation({ getCurrentPosition(success) { success({ coords: { latitude: NaN, longitude: 127 } }); } }), /확인하지/);
});
