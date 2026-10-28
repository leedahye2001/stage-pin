import assert from 'node:assert/strict';
import test from 'node:test';
import { claimPracticeSeats, createPracticeSeats, normalizePracticeCode, secondsRemaining, practiceQueue } from '../src/lib/ticketing-practice.ts';

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

test('100k virtual queue advances with wall clock time and never adds new arrivals ahead', () => {
  const opening = practiceQueue(1000, 1000, 32000);
  assert.equal(opening.visitors, 100000);
  assert.equal(opening.rank, 32000);
  const halfway = practiceQueue(1000, 11000, 32000);
  assert.equal(halfway.visitors, 106500);
  assert.equal(halfway.rank, 16000);
  assert.equal(halfway.progress, 0.5);
  assert.equal(halfway.secondsLeft, 10);
  const entered = practiceQueue(1000, 21000, 32000);
  assert.equal(entered.rank, 0);
  assert.equal(entered.progress, 1);
  const later = practiceQueue(1000, 900001, 32000);
  assert.equal(later.visitors, 130000);
  assert.equal(later.waiting, 0);
  assert.equal(later.secondsLeft, 0);
});

test('virtual competitors claim seats without touching the held seat or replenishing inventory', () => {
  const original = createPracticeSeats().map((seat) => ({ ...seat, taken: false }));
  let current = claimPracticeSeats(original, '12');
  assert.equal(original.filter((seat) => seat.taken).length, 0);
  assert.equal(current.filter((seat) => seat.taken).length, 2);
  for (let round = 0; round < 30; round++) current = claimPracticeSeats(current, '12');
  assert.equal(current.filter((seat) => !seat.taken).length, 1);
  assert.equal(current.find((seat) => seat.id === '12').taken, false);
  assert.deepEqual(claimPracticeSeats([], '12'), []);
});
