import type { ArtistSearchResult, Concert } from '@/api/concerts';

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function artistConcertKeywords(artists: ArtistSearchResult[]): string[] {
  const keywords = artists.flatMap(artist => [artist.searchName, artist.name,
    artist.aliases.find(alias => /[가-힣]/u.test(alias)) ?? '']);
  return [...new Map(keywords.filter(name => normalize(name).length >= 2)
    .map(name => [normalize(name), name.trim()])).values()];
}

export function homeConcerts(concerts: Concert[], favorites: ArtistSearchResult[], now: number): Concert[] {
  const names = new Set(favorites.flatMap(artist => [artist.name, artist.searchName, ...artist.aliases])
    .map(normalize).filter(name => name.length >= 2));
  const ids = new Set(favorites.map(artist => artist.id).filter(Boolean));
  const matchesTitle = (title: string) => [...names].some(name => {
    const pattern = [...name].join('[\\s._·-]*');
    // Latin names need boundaries: IVE must not match LIVE. Korean titles often join names to 공연/팬미팅.
    return /[가-힣]/u.test(name) ? normalize(title).includes(name)
      : new RegExp(`(?:^|[^\\p{L}\\p{N}])${pattern}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(title);
  });
  const matched = concerts.filter(concert => ['KOPIS', 'STAGEPIN'].includes(concert.source)
    && concert.status !== 'CANCELLED' && concert.status !== 'COMPLETED'
    && new Date(concert.endsAt ?? concert.startsAt).getTime() >= now
    && (concert.artists.some(artist => ids.has(artist.id) || names.has(normalize(artist.name)))
      || matchesTitle(concert.title ?? '')));
  return [...new Map(matched.map(concert => [concert.id, concert])).values()]
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}
