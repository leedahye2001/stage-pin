import assert from 'node:assert/strict';
import test from 'node:test';
import { kopisSourceId, mergeMapConcerts } from '../src/lib/kopis-source.ts';

const saved = { id: 'saved', source: 'KOPIS', officialUrl: 'https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?mt20Id=PF123456', venue: { latitude: 37.5665, longitude: 126.978 } };
test('extracts only valid KOPIS IDs from official host URLs', () => {
  assert.equal(kopisSourceId(saved), 'PF123456');
  for (const officialUrl of ['bad', 'https://evil.com/?mt20Id=PF123456', 'https://kopis.or.kr/?mt20Id=../secret', 'https://kopis.or.kr/']) {
    assert.equal(kopisSourceId({ ...saved, officialUrl }), null);
  }
  assert.equal(kopisSourceId({ ...saved, source: 'OTHER' }), null);
});
test('never maps cached KOPIS coordinates until details are refreshed; failed refresh stays excluded', () => {
  const local = { ...saved, id: 'local', source: 'USER' };
  assert.deepEqual(mergeMapConcerts([saved, local], [], []), [local]);
  const refreshed = { ...saved, venue: { latitude: 37.521, longitude: 127.121 } };
  assert.deepEqual(mergeMapConcerts([saved], [refreshed], []), [refreshed]);
  const latest = { ...refreshed, title: 'latest' };
  assert.deepEqual(mergeMapConcerts([saved], [refreshed], [latest]), [latest]);
});
