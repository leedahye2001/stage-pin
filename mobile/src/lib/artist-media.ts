import type { ArtistSearchResult } from '@/api/concerts';

export function usableArtistImage(artist: ArtistSearchResult): boolean {
  if (!artist.imageUrl) return false;
  return Boolean(artist.imageLicense && /^(CC BY(?:-SA)? [234]\.0|CC0)$/.test(artist.imageLicense)
    && artist.imagePageUrl?.startsWith('https://commons.wikimedia.org/wiki/File:')
    && /^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(artist.imageUrl)
    && (artist.imageAttribution || artist.imageLicense === 'CC0'));
}
