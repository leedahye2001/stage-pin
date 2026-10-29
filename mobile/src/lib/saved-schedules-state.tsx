import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { mergeSchedules, parseSavedSchedules, type SavedSchedule } from '@/lib/saved-schedules';

const storageKey = 'stagepin:saved-schedules:v1';
type State = { items: SavedSchedule[]; ready: boolean; loadError: string;
  save: (items: SavedSchedule[]) => Promise<void>; remove: (id: string) => Promise<void>;
  setAttending: (id: string, attending: boolean) => Promise<void> };
const Context = createContext<State | null>(null);

export function SavedSchedulesProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<SavedSchedule[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const current = useRef<SavedSchedule[]>([]);
  const queue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(parseSavedSchedules).then((saved) => {
      if (!active) return;
      current.current = saved; setItems(saved); setReady(true);
    }).catch(() => { if (active) setLoadError('기기에 저장된 일정을 읽지 못했어요. 새로고침 후 다시 시도해 주세요. 기존 데이터는 유지돼요.'); });
    return () => { active = false; };
  }, []);

  const update = (change: (items: SavedSchedule[]) => SavedSchedule[]) => {
    if (!ready) return Promise.reject(new Error('저장된 일정을 먼저 불러와 주세요.'));
    const operation = queue.current.catch(() => {}).then(async () => {
      const next = change(current.current);
      try { await AsyncStorage.setItem(storageKey, JSON.stringify(next)); }
      catch { throw new Error('기기 저장에 실패했어요. 저장 공간·브라우저 설정을 확인하고 다시 시도해 주세요.'); }
      current.current = next; setItems(next);
    });
    queue.current = operation;
    return operation;
  };

  return <Context.Provider value={{ items, ready, loadError,
    save: (additions) => update((saved) => mergeSchedules(saved, additions)),
    remove: (id) => update((saved) => saved.filter((item) => item.id !== id)),
    setAttending: (id, attending) => update((saved) => saved.map((item) => item.id === id && item.type === 'SHOW' ? { ...item, attending } : item)),
  }}>{children}</Context.Provider>;
}

export function useSavedSchedules() {
  const context = useContext(Context);
  if (!context) throw new Error('SavedSchedulesProvider is required');
  return context;
}
