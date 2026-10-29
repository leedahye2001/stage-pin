import { createContext, useContext, useState, type ReactNode } from 'react';
import { View } from 'react-native';

type Listener = (x: number, y: number) => void;
const OutsidePressContext = createContext<Set<Listener> | null>(null);

// Observe native touches without claiming the responder or swallowing the tapped button.
export function OutsidePressProvider({ children }: { children: ReactNode }) {
  const [listeners] = useState(() => new Set<Listener>());
  return <OutsidePressContext.Provider value={listeners}><View style={{ flex: 1 }} onStartShouldSetResponderCapture={event => {
    const { pageX, pageY } = event.nativeEvent;
    listeners.forEach(listener => listener(pageX, pageY));
    return false;
  }}>{children}</View></OutsidePressContext.Provider>;
}

export function useOutsidePressListeners() { return useContext(OutsidePressContext); }
