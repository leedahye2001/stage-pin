import type { ArtistSearchResult } from '@/api/concerts';

export function isSpotifyArtist(artist: ArtistSearchResult): boolean {
  return artist.imageLicense === 'Spotify'
    && /^https:\/\/open\.spotify\.com\/artist\/[A-Za-z0-9]{22}$/.test(artist.imagePageUrl ?? '');
}

export function usableArtistImage(artist: ArtistSearchResult): boolean {
  if (!artist.imageUrl) return false;
  if (isSpotifyArtist(artist)) return artist.imageUrl.startsWith('https://i.scdn.co/image/');
  return Boolean(artist.imageLicense && /^(CC BY(?:-SA)? [234]\.0|CC0)$/.test(artist.imageLicense)
    && artist.imagePageUrl?.startsWith('https://commons.wikimedia.org/wiki/File:')
    && /^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(artist.imageUrl)
    && (artist.imageAttribution || artist.imageLicense === 'CC0'));
}
