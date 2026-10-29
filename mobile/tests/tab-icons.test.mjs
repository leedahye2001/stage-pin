import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTabIconImages } from '../src/lib/tab-icons.ts';

const image = (name) => ({ uri: `file:///${name}.png`, width: 21, height: 21, scale: 1 });

test('native icons publish default and selected images together at 21pt', async () => {
  let release;
  let published = false;
  const blocked = new Promise((resolve) => { release = resolve; });
  const result = loadTabIconImages(async (name, size) => {
    assert.equal(size, 21);
    if (name === 'home-outline') await blocked;
    return image(name);
  }).then((pairs) => { published = true; return pairs; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(published, false);
  release();
  const pairs = await result;
  assert.equal(pairs.length, 4);
  assert.ok(pairs.every((pair) => pair.default.uri && pair.selected.uri));
});

test('missing native image rejects the batch instead of publishing a selected-only icon', async () => {
  await assert.rejects(loadTabIconImages(async (name) => name === 'home-outline' ? null : image(name)), /not ready/);
});
