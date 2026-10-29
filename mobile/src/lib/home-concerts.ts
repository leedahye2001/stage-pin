import type { ArtistSearchResult, Concert, TicketVendor } from '@/api/concerts';

type ArtistIdentity = Pick<ArtistSearchResult, 'id' | 'name' | 'searchName' | 'aliases'>;

// Editorial seed keywords, not measured popularity or a ranking.
export const popularArtists: ArtistIdentity[] = [
  { id: 'seed-day6', name: 'DAY6', searchName: 'DAY6', aliases: ['데이식스'] },
  { id: 'seed-bts', name: 'BTS', searchName: 'BTS', aliases: ['방탄소년단'] },
  { id: 'seed-seventeen', name: 'SEVENTEEN', searchName: 'SEVENTEEN', aliases: ['세븐틴'] },
  { id: 'seed-ive', name: 'IVE', searchName: 'IVE', aliases: ['아이브'] },
  { id: 'seed-aespa', name: 'aespa', searchName: 'aespa', aliases: ['에스파'] },
  { id: 'seed-nct', name: 'NCT', searchName: 'NCT', aliases: ['엔시티'] },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

const matchesTitle = (title: string, names: Set<string>) => [...names].some(name => {
  const pattern = [...name].join('[\\s._·-]*');
  // Latin names need boundaries: IVE must not match LIVE. Korean titles often join names to 공연/팬미팅.
  return /[가-힣]/u.test(name) ? normalize(title).includes(name)
    : new RegExp(`(?:^|[^\\p{L}\\p{N}])${pattern}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(title);
});

export function concertArtistNames(concert: Pick<Concert, 'artists' | 'title'>, candidates: ArtistSearchResult[]): string {
  const names = concert.artists.map(artist => artist.name.trim()).filter(Boolean);
  if (names.length) return [...new Set(names)].join(', ');
  // shortcut: only known favorite profiles supplement missing cast; use canonical artist links when the catalog supports them.
  return [...new Set(candidates.filter(artist => matchesTitle(concert.title, new Set(
    [artist.name, artist.searchName, ...artist.aliases].map(normalize).filter(name => name.length >= 2),
  ))).map(artist => artist.name))].join(', ');
}

const seoulDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });

export function concertPhase(concert: Pick<Concert, 'status' | 'startsAt' | 'endsAt' | 'source'>, now: number): '완료' | '진행 중' | '예정' | '취소' {
  if (concert.status === 'CANCELLED') return '취소';
  if (concert.status === 'COMPLETED') return '완료';
  const start = Date.parse(concert.startsAt);
  const end = Date.parse(concert.endsAt ?? concert.startsAt);
  // KOPIS dates have no reliable showtime: keep the last performance day ongoing until Seoul midnight.
  if (concert.source === 'KOPIS' && Number.isFinite(start) && Number.isFinite(end)) {
    const today = seoulDay.format(now);
    if (seoulDay.format(end) < today) return '완료';
    return seoulDay.format(start) > today ? '예정' : '진행 중';
  }
  if (end < now) return '완료';
  return start > now || !Number.isFinite(start) ? '예정' : '진행 중';
}

export function artistConcertKeywords(artists: ArtistIdentity[]): string[] {
  const keywords = artists.flatMap(artist => [artist.searchName, artist.name,
    artist.aliases.find(alias => /[가-힣]/u.test(alias)) ?? '']);
  return [...new Map(keywords.filter(name => normalize(name).length >= 2)
    .map(name => [normalize(name), name.trim()])).values()];
}

export function homeConcerts(concerts: Concert[], favorites: ArtistIdentity[], now: number): Concert[] {
  const names = new Set(favorites.flatMap(artist => [artist.name, artist.searchName, ...artist.aliases])
    .map(normalize).filter(name => name.length >= 2));
  const ids = new Set(favorites.map(artist => artist.id).filter(Boolean));
  const matched = concerts.filter(concert => ['KOPIS', 'STAGEPIN'].includes(concert.source)
    && concert.status !== 'CANCELLED'
    && (concert.artists.some(artist => ids.has(artist.id) || names.has(normalize(artist.name)))
      || matchesTitle(concert.title ?? '', names)));
  return [...new Map(matched.map(concert => [concert.id, concert])).values()]
    .sort((a, b) => {
      const rank = { '진행 중': 0, '예정': 1, '완료': 2, '취소': 3 };
      const phaseA = concertPhase(a, now);
      const phaseB = concertPhase(b, now);
      return rank[phaseA] - rank[phaseB]
        || (phaseA === '완료' ? Date.parse(b.startsAt) - Date.parse(a.startsAt) : Date.parse(a.startsAt) - Date.parse(b.startsAt));
    });
}

export function vendorConcertCandidates(concerts: Concert[], now: number): Concert[] {
  const candidates = popularArtists.flatMap(artist => homeConcerts(concerts, [artist], now).slice(0, 2));
  return homeConcerts(candidates, popularArtists, now);
}

export function concertVendors(concert: Pick<Concert, 'ticketLinks'>): TicketVendor[] {
  const vendors: TicketVendor[] = [];
  for (const link of concert.ticketLinks ?? []) {
    try {
      const url = new URL(link.url);
      if (!['http:', 'https:'].includes(url.protocol)) continue;
      const host = url.hostname.toLowerCase();
      const domain = (name: string) => host === name || host.endsWith(`.${name}`);
      const vendor: TicketVendor = domain('yes24.com') ? 'YES24'
        : domain('interpark.com') || host === 'nol.yanolja.com' ? 'NOL'
          : host === 'ticket.melon.com' ? 'MELON'
            : domain('ticketlink.co.kr') ? 'TICKETLINK' : 'OTHER';
      vendors.push(vendor);
    } catch { /* Missing or malformed URLs are not evidence of a ticket vendor. */ }
  }
  return [...new Set(vendors)];
}
