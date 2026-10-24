import assert from 'node:assert/strict';
import test from 'node:test';
import { createPracticeSeats, normalizePracticeCode, secondsRemaining } from '../src/lib/ticketing-practice.ts';

test('practice inventory has unique valid seats and always an available seat', () => {
  for (let run = 0; run < 25; run++) {
    const seats = createPracticeSeats();
    assert.equal(seats.length, 48);
    assert.equal(new Set(seats.map((seat) => seat.id)).size, 48);
    assert.ok(seats.some((seat) => !seat.taken));
    assert.ok(seats.every((seat) => seat.row >= 1 && seat.row <= 6 && seat.number >= 1 && seat.number <= 8));
  }
});

test('timer uses the deadline rather than interval counts and clamps after expiration', () => {
  assert.equal(secondsRemaining(121000, 1000), 120);
  assert.equal(secondsRemaining(121000, 120999), 1);
  assert.equal(secondsRemaining(121000, 121000), 0);
  assert.equal(secondsRemaining(121000, 500000), 0);
});

test('practice security code accepts lowercase and whitespace but rejects wrong letters', () => {
  assert.equal(normalizePracticeCode(' stage 7 '), 'STAGE7');
  assert.notEqual(normalizePracticeCode('STAGE8'), 'STAGE7');
});
