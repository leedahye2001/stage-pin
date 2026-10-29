import type { Concert, VenueSummary } from '../api/concerts';

export function mapVenues(concerts: Concert[]) {
  const groups = new Map<string, { key: string; venue: VenueSummary; concerts: Concert[] }>();
  for (const concert of concerts) {
    const { latitude, longitude } = concert.venue;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
      || Math.abs(latitude) > 90 || Math.abs(longitude) > 180
      || (latitude === 0 && longitude === 0)) continue;
    const key = concert.venue.id || `${concert.venue.name}:${latitude}:${longitude}`;
    const group = groups.get(key);
    if (group) {
      if (!group.concerts.some(item => item.id === concert.id)) group.concerts.push(concert);
    } else groups.set(key, { key, venue: concert.venue, concerts: [concert] });
  }
  return [...groups.values()];
}
