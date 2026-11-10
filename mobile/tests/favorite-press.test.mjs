import test from 'node:test';
import assert from 'node:assert/strict';
import { favoritePress } from '../src/lib/favorite-press.ts';

test('heart stops navigation bubbling before toggling exactly once', () => {
  const actions = [];
  let stopped = false;
  favoritePress({ stopPropagation: () => { stopped = true; actions.push('stop'); } }, () => actions.push('favorite'));
  if (!stopped) actions.push('detail');
  assert.deepEqual(actions, ['stop', 'favorite']);
});
