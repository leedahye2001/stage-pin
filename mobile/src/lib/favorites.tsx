import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react';

import type { ArtistSearchResult, Concert } from '@/api/concerts';

type Favorites = {
  artists: ArtistSearchResult[];
  concerts: Concert[];
};

type FavoritesContextValue = Favorites & {
  isArtistFavorite: (id: string) => boolean;
  isConcertFavorite: (id: string) => boolean;
  toggleArtist: (artist: ArtistSearchResult) => void;
  toggleConcert: (concert: Concert) => void;
};

const storageKey = 'stagepin:favorites';
const emptyFavorites: Favorites = { artists: [], concerts: [] };
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState(emptyFavorites);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (!value) return;
        const saved = JSON.parse(value) as Partial<Favorites>;
        setFavorites({
          artists: Array.isArray(saved.artists) ? saved.artists : [],
          concerts: Array.isArray(saved.concerts) ? saved.concerts : [],
        });
      })
      .catch(() => setFavorites(emptyFavorites))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(storageKey, JSON.stringify(favorites));
  }, [favorites, loaded]);

  const toggleArtist = (artist: ArtistSearchResult) => {
    setFavorites((current) => ({
      ...current,
      artists: current.artists.some((item) => item.id === artist.id)
        ? current.artists.filter((item) => item.id !== artist.id)
        : [artist, ...current.artists],
    }));
  };

  const toggleConcert = (concert: Concert) => {
    setFavorites((current) => ({
      ...current,
      concerts: current.concerts.some((item) => item.id === concert.id)
        ? current.concerts.filter((item) => item.id !== concert.id)
        : [concert, ...current.concerts],
    }));
  };

  return (
    <FavoritesContext.Provider
      value={{
        ...favorites,
        isArtistFavorite: (id) => favorites.artists.some((artist) => artist.id === id),
        isConcertFavorite: (id) => favorites.concerts.some((concert) => concert.id === id),
        toggleArtist,
        toggleConcert,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
