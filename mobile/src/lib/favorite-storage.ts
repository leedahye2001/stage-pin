import type { ArtistSearchResult, Concert } from '../api/concerts.ts';

export type Favorites = { artists: ArtistSearchResult[]; concerts: Concert[] };
export const emptyFavorites: Favorites = { artists: [], concerts: [] };

export function parseFavorites(value: string | null): Favorites {
  if (!value) return { artists: [], concerts: [] };
  const data = JSON.parse(value);
  if (!data || !Array.isArray(data.artists) || !Array.isArray(data.concerts)
      || data.artists.some((item: ArtistSearchResult) => !item || typeof item.id !== 'string' || typeof item.name !== 'string' || !Array.isArray(item.aliases))
      || data.concerts.some((item: Concert) => !item || typeof item.id !== 'string' || typeof item.title !== 'string' || !item.venue || !Array.isArray(item.artists)))
    throw new Error('저장된 찜 정보를 읽지 못했어요. 기존 데이터는 유지돼요.');
  return { artists: data.artists, concerts: data.concerts };
}

export function changeFavorite(current: Favorites, kind: 'ARTIST' | 'CONCERT', item: ArtistSearchResult | Concert): Favorites {
  if (kind === 'ARTIST') return { ...current, artists: current.artists.some(value => value.id === item.id)
    ? current.artists.filter(value => value.id !== item.id) : [item as ArtistSearchResult, ...current.artists] };
  return { ...current, concerts: current.concerts.some(value => value.id === item.id)
    ? current.concerts.filter(value => value.id !== item.id) : [item as Concert, ...current.concerts] };
}

// An old request may finish after logout/account switch; never apply it to the new session.
export async function writeForOwner<T>(owner: string | null, currentOwner: () => string | null | undefined,
    request: () => Promise<T>, apply: (value: T) => void): Promise<void> {
  if (owner !== currentOwner()) return;
  const value = await request();
  if (owner === currentOwner()) apply(value);
}
