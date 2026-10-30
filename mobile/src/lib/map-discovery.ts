import type { Concert } from '../api/concerts';
import type { MapLocation } from './current-location';
import { mapVenues } from './map-venues';
import { popularArtists } from './home-concerts';

export type MapPeriod = 'all' | 'today' | 'week' | 'month';
const normalize = (value: string) => value.toLocaleLowerCase().replace(/[\s·:_-]/g, '');
const day = (date: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date);

export function distanceKm(a: MapLocation, b: MapLocation) {
  const rad = Math.PI / 180;
  const lat = (b.latitude - a.latitude) * rad, lng = (b.longitude - a.longitude) * rad;
  const h = Math.sin(lat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(lng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function discoverVenues(concerts: Concert[], options: {
  query: string; period: MapPeriod; city: string; favoritesOnly: boolean; favoriteIds: string[];
  location: MapLocation | null; now: number;
}) {
  const keyword = normalize(options.query.trim()), today = day(options.now);
  const terms = [keyword, ...popularArtists.filter(artist => [artist.name, artist.searchName, ...artist.aliases].some(name => normalize(name) === keyword))
    .flatMap(artist => [artist.name, artist.searchName, ...artist.aliases]).map(normalize)];
  const until = options.period === 'month' ? `${today.slice(0, 7)}-31`
    : options.period === 'week' ? day(options.now + 6 * 86400000) : today;
  const favorites = new Set(options.favoriteIds);
  const filtered = concerts.filter(concert => {
    if (options.favoritesOnly && !favorites.has(concert.id)) return false;
    if (options.city && concert.venue.city !== options.city) return false;
    const text = normalize([concert.title, concert.venue.name, concert.venue.city, concert.venue.address ?? '', ...concert.artists.map(artist => artist.name)].join(' '));
    if (keyword && !terms.some(term => text.includes(term))) return false;
    const start = Date.parse(concert.startsAt), end = Date.parse(concert.endsAt || concert.startsAt);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
    if (options.period === 'all') return true;
    return concert.status !== 'CANCELLED'
      && day(start) <= until && day(end) >= today;
  });
  return mapVenues(filtered).map(group => ({ ...group,
    distance: options.location ? distanceKm(options.location, group.venue) : null,
    concerts: [...group.concerts].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
  })).sort((a, b) => options.location ? a.distance! - b.distance! : a.venue.name.localeCompare(b.venue.name, 'ko'));
}
