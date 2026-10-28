import { createContext, useContext, useState, type ReactNode } from 'react';
import { demoGoods, type DemoGoods } from '@/lib/goods-demo';

type DemoState = { items: DemoGoods[]; addListing: (item: DemoGoods) => void; saved: string[]; requested: string[]; toggleSaved: (id: string) => void; request: (id: string) => void };
const Context = createContext<DemoState | null>(null);

export function GoodsDemoProvider({ children }: { children: ReactNode }) {
  // Demo state intentionally stays in memory; never sends a real trade request.
  const [saved, setSaved] = useState<string[]>(['demo-svt-1']);
  const [items, setItems] = useState(demoGoods);
  const [requested, setRequested] = useState<string[]>([]);
  return <Context.Provider value={{ items, addListing: (item) => setItems((current) => [item, ...current]), saved, requested,
    toggleSaved: (id) => setSaved((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]),
    request: (id) => setRequested((current) => current.includes(id) ? current : [...current, id]),
  }}>{children}</Context.Provider>;
}

export function useGoodsDemo() {
  const state = useContext(Context);
  if (!state) throw new Error('GoodsDemoProvider is required');
  return state;
}
