export function popularSearchUpdateLabel(updatedAt: string): string {
  return `${new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: 'numeric', hour12: true }).format(new Date(updatedAt))} 업데이트`;
}

export function millisecondsUntilNextHour(now = Date.now()): number {
  return 3_600_000 - now % 3_600_000;
}
