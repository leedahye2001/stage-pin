import { createContext, useContext, useState, type ReactNode } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { getCurrentMember } from '@/api/auth';
import { favoriteWriteOwner } from '@/lib/favorite-access';
import { getGoods, goodsBase } from '@/api/goods';
import { goodsItem, type GoodsItem } from '@/lib/goods-listings';

type GoodsState = { items: GoodsItem[]; loading: boolean; error: string | null; refresh: () => void;
  hasMore: boolean; loadingMore: boolean; loadMore: () => void; saved: string[]; toggleSaved: (id: string) => void };
const Context = createContext<GoodsState | null>(null);

export function GoodsProvider({ children }: { children: ReactNode }) {
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember, retry: false });
  const owner = member.isError ? undefined : member.data?.id;
  const [savedState, setSaved] = useState<{ owner: string; ids: string[] } | null>(null);
  const saved = owner && savedState?.owner === owner ? savedState.ids : [];
  const query = useInfiniteQuery({ queryKey: ['goods'], initialPageParam: 0,
    queryFn: ({ pageParam }) => getGoods(pageParam), getNextPageParam: (last, pages) => last.length === 24 ? pages.length : undefined,
    staleTime: 30000, retry: 1 });
  const items = query.data?.pages.flat().map(item => goodsItem(item, goodsBase())) ?? [];
  return <Context.Provider value={{ items, saved, loading: query.isPending,
    error: query.error ? '굿즈를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : null,
    refresh: () => { void query.refetch(); }, hasMore: Boolean(query.hasNextPage), loadingMore: query.isFetchingNextPage,
    loadMore: () => { void query.fetchNextPage(); },
    toggleSaved: (id) => {
      const writer = favoriteWriteOwner(owner, member.isError, () => router.push('/my'));
      if (!writer) return;
      setSaved(current => {
        const ids = current?.owner === writer ? current.ids : [];
        return { owner: writer, ids: ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id] };
      });
    },
  }}>{children}</Context.Provider>;
}

export function useGoods() {
  const state = useContext(Context);
  if (!state) throw new Error('GoodsProvider is required');
  return state;
}
