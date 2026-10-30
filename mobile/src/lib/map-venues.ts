import type { Concert, VenueSummary } from '../api/concerts';

export function hasVenueCoordinates(venue: VenueSummary) {
  return Number.isFinite(venue.latitude) && Number.isFinite(venue.longitude)
    && Math.abs(venue.latitude) <= 90 && Math.abs(venue.longitude) <= 180
    && !(venue.latitude === 0 && venue.longitude === 0);
}

export function mapVenues(concerts: Concert[]) {
  const groups = new Map<string, { key: string; venue: VenueSummary; concerts: Concert[] }>();
  for (const concert of concerts) {
    const { latitude, longitude } = concert.venue;
    if (!hasVenueCoordinates(concert.venue)) continue;
    const key = concert.venue.id || `${concert.venue.name}:${latitude}:${longitude}`;
    const group = groups.get(key);
    if (group) {
      if (!group.concerts.some(item => item.id === concert.id)) group.concerts.push(concert);
    } else groups.set(key, { key, venue: concert.venue, concerts: [concert] });
  }
  return [...groups.values()];
}
