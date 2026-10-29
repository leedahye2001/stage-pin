import type { ArtistSearchResult, Concert } from '@/api/concerts';

const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function homeConcerts(concerts: Concert[], favorites: ArtistSearchResult[], favoritesOnly: boolean, now: number): Concert[] {
  const names = new Set(favorites.flatMap((artist) => [artist.name, artist.searchName, ...artist.aliases]).map(normalize));
  return concerts.filter((concert) => concert.source === 'KOPIS'
    && concert.status !== 'CANCELLED' && concert.status !== 'COMPLETED'
    && new Date(concert.endsAt ?? concert.startsAt).getTime() >= now
    && (!favoritesOnly || concert.artists.some((artist) => names.has(normalize(artist.name)))));
}
