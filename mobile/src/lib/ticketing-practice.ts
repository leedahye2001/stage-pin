export type PracticeSeat = { id: string; row: number; number: number; taken: boolean };

export function createPracticeSeats(): PracticeSeat[] {
  return Array.from({ length: 48 }, (_, index) => ({
    id: String(index), row: Math.floor(index / 8) + 1, number: index % 8 + 1,
    taken: Math.random() < 0.62,
  })).map((seat, index) => index === 12 ? { ...seat, taken: false } : seat);
}

export function secondsRemaining(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function normalizePracticeCode(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}
