export type PracticeSeat = { id: string; row: number; number: number; taken: boolean };

export function createPracticeSeats(): PracticeSeat[] {
  return Array.from({ length: 48 }, (_, index) => ({
    id: String(index), row: Math.floor(index / 8) + 1, number: index % 8 + 1,
    taken: Math.random() < 0.62,
  })).map((seat, index) => index === 12 ? { ...seat, taken: false } : seat);
}

export function claimPracticeSeats(seats: PracticeSeat[], heldId?: string): PracticeSeat[] {
  const candidates = seats.filter((seat) => !seat.taken && seat.id !== heldId);
  const claimed = new Set<string>();
  while (candidates.length && claimed.size < 2) {
    const [seat] = candidates.splice(Math.floor(Math.random() * candidates.length), 1);
    claimed.add(seat.id);
  }
  return seats.map((seat) => claimed.has(seat.id) ? { ...seat, taken: true } : seat);
}

export function secondsRemaining(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function normalizePracticeCode(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}

// Aggregate virtual visitors; no requests or connections are created for them.
export function practiceQueue(startedAt: number, now: number, initialRank: number) {
  const seconds = Math.max(0, (now - startedAt) / 1000);
  const arrived = Math.min(30000, Math.floor(seconds * 650));
  const admitted = Math.floor(seconds * 1600);
  const rank = Math.max(0, initialRank - admitted);
  return {
    visitors: 100000 + arrived,
    waiting: Math.max(0, 100000 + arrived - admitted),
    rank,
    secondsLeft: Math.ceil(rank / 1600),
    progress: Math.min(1, Math.max(0, 1 - rank / initialRank)),
  };
}
