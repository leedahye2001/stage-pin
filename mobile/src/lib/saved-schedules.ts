import type { Concert, ConcertGenre, TicketOpening } from '@/api/concerts';

export type SavedSchedule = {
  id: string; type: 'SHOW' | 'FAN_PRESALE' | 'GENERAL_SALE';
  concertId: string | null; genre: ConcertGenre; title: string; artistName: string;
  startsAt: string; endsAt: string | null; dateOnly: boolean;
  venueName: string | null; vendor: string | null; ticketUrl: string | null;
  sourceUrl: string; attending: boolean;
};
export type ScheduleFilter = 'ALL' | 'TICKET' | 'SHOW';
export const scheduleLabels = { SHOW: '공연', FAN_PRESALE: '선예매', GENERAL_SALE: '일반예매' } as const;
export const vendorLabels: Record<string, string> = { NOL: 'NOL 티켓', YES24: 'YES24', MELON: '멜론티켓', TICKETLINK: '티켓링크', OTHER: '공식 예매처' };
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const validDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function isWebUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); } catch { return false; }
}

export function seoulDay(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)?.value).join('-');
}

export function calendarDays(month: string): (string | null)[] {
  const [year, number] = month.split('-').map(Number);
  const offset = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= count; day++) cells.push(`${month}-${String(day).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function moveMonth(month: string, amount: number): string {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + amount, 1)).toISOString().slice(0, 7);
}

export function openingSchedule(opening: TicketOpening): SavedSchedule | null {
  if (!['FAN_PRESALE', 'GENERAL_SALE'].includes(opening.type) || !validDate(opening.opensAt)
    || !validDate(opening.verifiedAt) || !isWebUrl(opening.sourceUrl) || !isWebUrl(opening.ticketUrl)
    || !opening.concertTitle.trim() || !opening.artistName.trim()) return null;
  return { id: `ticket:${opening.id}`, type: opening.type as SavedSchedule['type'], concertId: opening.concertId,
    genre: 'POPULAR_MUSIC', title: opening.concertTitle, artistName: opening.artistName,
    startsAt: opening.opensAt, endsAt: null, dateOnly: false, venueName: null,
    vendor: vendorLabels[opening.vendor] ?? '공식 예매처', ticketUrl: opening.ticketUrl, sourceUrl: opening.sourceUrl, attending: false };
}

export function concertScheduleOptions(concert: Concert, openings: TicketOpening[]): SavedSchedule[] {
  if (concert.source !== 'KOPIS' || concert.status === 'CANCELLED' || !validDate(concert.startsAt) || !isWebUrl(concert.officialUrl)
    || (concert.endsAt !== null && (!validDate(concert.endsAt) || Date.parse(concert.endsAt) < Date.parse(concert.startsAt)))) return [];
  const show: SavedSchedule = { id: `show:${concert.id}`, type: 'SHOW', concertId: concert.id, genre: concert.genre,
    title: concert.title, artistName: concert.artists.map((artist) => artist.name).join(', ') || '출연진 미등록',
    startsAt: concert.startsAt, endsAt: concert.endsAt, dateOnly: true, venueName: concert.venue.name,
    vendor: null, ticketUrl: concert.ticketLinks.find((link) => isWebUrl(link.url))?.url ?? null, sourceUrl: concert.officialUrl, attending: false };
  const tickets = openings.filter((opening) => opening.concertId === concert.id
    || (!opening.concertId && normalize(opening.concertTitle) === normalize(concert.title)
      && opening.artistName.split(/[,/&·+]/).some((name) => concert.artists.some((artist) => normalize(artist.name) === normalize(name)))))
    .map(openingSchedule).filter((item): item is SavedSchedule => item !== null).map((item) => ({ ...item, genre: concert.genre }));
  return [show, ...tickets];
}

export function schedulesForDay(items: SavedSchedule[], day: string, filter: ScheduleFilter): SavedSchedule[] {
  return items.filter((item) => seoulDay(item.startsAt) === day
    && (filter === 'ALL' || (filter === 'SHOW' ? item.type === 'SHOW' : item.type !== 'SHOW')))
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function mergeSchedules(current: SavedSchedule[], additions: SavedSchedule[]): SavedSchedule[] {
  const byId = new Map(current.map((item) => [item.id, item]));
  for (const item of additions) if (!byId.has(item.id)) byId.set(item.id, item);
  return [...byId.values()].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function parseSavedSchedules(value: string | null): SavedSchedule[] {
  if (!value) return [];
  const items: unknown = JSON.parse(value);
  if (!Array.isArray(items) || !items.every((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const item = entry as SavedSchedule;
    return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.artistName === 'string'
      && ['SHOW', 'FAN_PRESALE', 'GENERAL_SALE'].includes(item.type)
      && ['POPULAR_MUSIC', 'MUSICAL', 'PLAY', 'CLASSICAL'].includes(item.genre)
      && (item.concertId === null || typeof item.concertId === 'string') && validDate(item.startsAt)
      && (item.endsAt === null || validDate(item.endsAt)) && typeof item.dateOnly === 'boolean'
      && typeof item.attending === 'boolean' && (item.type === 'SHOW' || !item.attending)
      && (item.venueName === null || typeof item.venueName === 'string')
      && (item.vendor === null || typeof item.vendor === 'string')
      && (item.ticketUrl === null || isWebUrl(item.ticketUrl)) && isWebUrl(item.sourceUrl);
  })) throw new Error('저장된 일정 형식을 확인하지 못했어요. 기존 데이터는 덮어쓰지 않았어요.');
  return mergeSchedules([], items);
}
