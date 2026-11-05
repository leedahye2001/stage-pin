import { createContext, useContext, useState, type ReactNode } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getGoods, goodsBase } from '@/api/goods';
import { goodsItem, type GoodsItem } from '@/lib/goods-listings';

type GoodsState = { items: GoodsItem[]; loading: boolean; error: string | null; refresh: () => void;
  hasMore: boolean; loadingMore: boolean; loadMore: () => void; saved: string[]; toggleSaved: (id: string) => void };
const Context = createContext<GoodsState | null>(null);

export function GoodsProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const query = useInfiniteQuery({ queryKey: ['goods'], initialPageParam: 0,
    queryFn: ({ pageParam }) => getGoods(pageParam), getNextPageParam: (last, pages) => last.length === 24 ? pages.length : undefined,
    staleTime: 30000, retry: 1 });
  const items = query.data?.pages.flat().map(item => goodsItem(item, goodsBase())) ?? [];
  return <Context.Provider value={{ items, saved, loading: query.isPending,
    error: query.error ? '굿즈를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' : null,
    refresh: () => { void query.refetch(); }, hasMore: Boolean(query.hasNextPage), loadingMore: query.isFetchingNextPage,
    loadMore: () => { void query.fetchNextPage(); },
    toggleSaved: (id) => setSaved((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]),
  }}>{children}</Context.Provider>;
}

export function useGoods() {
  const state = useContext(Context);
  if (!state) throw new Error('GoodsProvider is required');
  return state;
}
