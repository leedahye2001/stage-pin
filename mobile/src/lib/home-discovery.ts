import type { Concert, TicketOpening } from '../api/concerts';
import { concertPhase } from './home-concerts';

export function homeConcertAudience(memberId: string | undefined, favoritesReady: boolean, artistCount: number) {
  return memberId && favoritesReady && artistCount > 0 ? 'following' : 'public';
}

export function discoveryConcerts(concerts: Concert[], now: number): Concert[] {
  return [...new Map(concerts.filter(item => ['KOPIS', 'STAGEPIN'].includes(item.source)
    && Number.isFinite(Date.parse(item.startsAt)) && Number.isFinite(Date.parse(item.endsAt ?? item.startsAt))
    && Date.parse(item.endsAt ?? item.startsAt) >= Date.parse(item.startsAt)
    && ['예정', '진행 중'].includes(concertPhase(item, now))).map(item => [item.id, item])).values()]
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function upcomingOpenings(openings: TicketOpening[], now: number): TicketOpening[] {
  return [...new Map(openings.filter(item => ['FAN_PRESALE', 'GENERAL_SALE'].includes(item.type)
    && Date.parse(item.opensAt) > now && Number.isFinite(Date.parse(item.verifiedAt))
    && [item.ticketUrl, item.sourceUrl].every(value => {
      try { return ['https:', 'http:'].includes(new URL(value).protocol); }
      catch { return false; }
    })).map(item => [item.id, item])).values()]
    .sort((a, b) => Date.parse(a.opensAt) - Date.parse(b.opensAt));
}
