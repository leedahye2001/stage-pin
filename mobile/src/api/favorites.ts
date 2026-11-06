import { memberRequest } from '@/api/auth';
import type { ArtistSearchResult, Concert } from '@/api/concerts';
import { parseFavorites, type Favorites } from '@/lib/favorite-storage';

type Change = { kind: 'ARTIST' | 'CONCERT'; id: string; selected: boolean; snapshot?: ArtistSearchResult | Concert };
async function request(owner: string, body?: Change): Promise<Favorites> {
  const data = await memberRequest<Favorites>('/api/v1/favorites', {
    headers: { 'Content-Type': 'application/json', 'X-StagePin-Member-Id': owner },
    ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }),
  });
  return parseFavorites(JSON.stringify(data));
}
export function getFavorites(owner: string) { return request(owner); }
export function saveFavorite(owner: string, change: Change) { return request(owner, change); }
