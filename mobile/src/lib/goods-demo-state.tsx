import { createContext, useContext, useState, type ReactNode } from 'react';

type DemoState = { saved: string[]; requested: string[]; toggleSaved: (id: string) => void; request: (id: string) => void };
const Context = createContext<DemoState | null>(null);

export function GoodsDemoProvider({ children }: { children: ReactNode }) {
  // Demo state intentionally stays in memory; never sends a real trade request.
  const [saved, setSaved] = useState<string[]>(['demo-svt-1']);
  const [requested, setRequested] = useState<string[]>([]);
  return <Context.Provider value={{ saved, requested,
    toggleSaved: (id) => setSaved((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]),
    request: (id) => setRequested((current) => current.includes(id) ? current : [...current, id]),
  }}>{children}</Context.Provider>;
}

export function useGoodsDemo() {
  const state = useContext(Context);
  if (!state) throw new Error('GoodsDemoProvider is required');
  return state;
}
