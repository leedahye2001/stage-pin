type Identity = { name: string; searchName: string; aliases: string[] };
const normalize = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export function favoriteOpenings<T extends { artistName: string }>(openings: T[], artists: Identity[]): T[] {
  const names = new Set(artists.flatMap((artist) => [artist.name, artist.searchName, ...(artist.aliases ?? [])]).filter(Boolean).map(normalize).filter(Boolean));
  return openings.filter((opening) => opening.artistName.split(/[,/&·+]/).some((name) => names.has(normalize(name))));
}
