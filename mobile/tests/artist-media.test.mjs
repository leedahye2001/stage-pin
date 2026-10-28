import assert from 'node:assert/strict';
import test from 'node:test';
import { isSpotifyArtist, usableArtistImage } from '../src/lib/artist-media.ts';

test('Spotify images require the real artist link and trusted image host', () => {
  const artist = { imageLicense: 'Spotify', imagePageUrl: 'https://open.spotify.com/artist/1234567890123456789012', imageUrl: 'https://i.scdn.co/image/example' };
  assert.equal(isSpotifyArtist(artist), true);
  assert.equal(usableArtistImage(artist), true);
  assert.equal(usableArtistImage({ ...artist, imageUrl: 'https://i.scdn.co.evil/image/example' }), false);
  assert.equal(isSpotifyArtist({ ...artist, imagePageUrl: 'https://evil.test/artist/1234567890123456789012' }), false);
  assert.equal(usableArtistImage({ ...artist, imageUrl: null }), false);
});

test('Commons credit requirements are preserved for previously saved favorites', () => {
  const artist = { imageLicense: 'CC BY-SA 4.0', imagePageUrl: 'https://commons.wikimedia.org/wiki/File:Example.jpg', imageUrl: 'https://upload.wikimedia.org/example.jpg', imageAttribution: 'Author' };
  assert.equal(usableArtistImage(artist), true);
  assert.equal(usableArtistImage({ ...artist, imageAttribution: '' }), false);
  assert.equal(usableArtistImage({ ...artist, imageLicense: 'All rights reserved' }), false);
});
