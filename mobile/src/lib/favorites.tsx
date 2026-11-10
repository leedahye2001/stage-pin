import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, type PropsWithChildren, useContext, useEffect, useRef, useState } from 'react';

import type { ArtistSearchResult, Concert } from '@/api/concerts';
import { AuthRequiredError, getCurrentMember, type Member } from '@/api/auth';
import { getFavorites, saveFavorite } from '@/api/favorites';
import { emptyFavorites, writeForOwner, type Favorites } from '@/lib/favorite-storage';
import { favoriteWriteOwner } from '@/lib/favorite-access';

type FavoritesContextValue = Favorites & {
  ready: boolean; busy: boolean; error: string;
  retry: () => void;
  isArtistFavorite: (id: string) => boolean;
  isConcertFavorite: (id: string) => boolean;
  toggleArtist: (artist: ArtistSearchResult) => void;
  toggleConcert: (concert: Concert) => void;
};
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: PropsWithChildren) {
  const client = useQueryClient();
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember, retry: false });
  const owner = member.data?.id;
  const account = useQuery({ queryKey: ['member-favorites', owner], queryFn: () => getFavorites(owner!), enabled: Boolean(owner), retry: false, staleTime: 0 });
  const [writeError, setWriteError] = useState<{ owner: string | null; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const currentOwner = () => {
    const value = client.getQueryData<Member | null>(['current-member']);
    return value === null ? null : value?.id;
  };
  useEffect(() => {
    // Do not retain another member's favorites in the QueryClient after logout/switch.
    client.removeQueries({ predicate: query => query.queryKey[0] === 'member-favorites' && query.queryKey[1] !== owner });
  }, [owner, client]);

  const signedOut = member.data === null;
  const ready = signedOut || Boolean(owner && account.isSuccess && !member.isError);
  const favorites = owner && !member.isError ? account.data ?? emptyFavorites : emptyFavorites;

  function perform(request: () => Promise<Favorites>, expectedOwner: string | null) {
    if (locked.current || !ready) return;
    locked.current = true; setBusy(true); setWriteError(null);
    void writeForOwner(expectedOwner, currentOwner, async () => {
      if (expectedOwner) await client.cancelQueries({ queryKey: ['member-favorites', expectedOwner] });
      if (expectedOwner !== currentOwner()) throw new Error('로그인 계정이 변경됐어요. 다시 확인해 주세요.');
      return request();
    }, next => {
      if (expectedOwner) client.setQueryData(['member-favorites', expectedOwner], next);
    }).catch(cause => {
      if (expectedOwner !== currentOwner()) return;
      setWriteError({ owner: expectedOwner, message: cause instanceof Error ? cause.message : '찜 저장에 실패했어요. 다시 눌러 주세요.' });
      if (cause instanceof AuthRequiredError) {
        client.setQueryData(['current-member'], null);
        router.push('/my');
      }
    }).finally(() => { locked.current = false; setBusy(false); });
  }
  function toggle(kind: 'ARTIST' | 'CONCERT', item: ArtistSearchResult | Concert) {
    const writer = favoriteWriteOwner(owner, member.isError, () => router.push('/my'));
    if (writer) {
      const items = kind === 'ARTIST' ? favorites.artists : favorites.concerts;
      const selected = !items.some(value => value.id === item.id);
      perform(() => saveFavorite(writer, { kind, id: item.id, selected, ...(selected ? { snapshot: item } : {}) }), writer);
    }
  }
  return <FavoritesContext.Provider value={{
    ...favorites, ready, busy,
    error: (writeError?.owner === (signedOut ? null : owner) ? writeError?.message : '') || (owner && account.isError ? '계정 찜을 불러오지 못했어요. 다시 시도해 주세요.' : member.isError ? '로그인 상태를 확인하지 못했어요.' : ''),
    retry: () => { setWriteError(null); void member.refetch(); if (owner) void account.refetch(); },
    isArtistFavorite: id => favorites.artists.some(item => item.id === id),
    isConcertFavorite: id => favorites.concerts.some(item => item.id === id),
    toggleArtist: artist => toggle('ARTIST', artist),
    toggleConcert: concert => toggle('CONCERT', concert),
  }}>{children}</FavoritesContext.Provider>;
}
export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
