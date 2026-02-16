import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  onOnline: (callback: () => Promise<void>) => void;
  offOnline: (callback: () => Promise<void>) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  onOnline: () => {},
  offOnline: () => {},
});

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const onlineCallbacksRef = useRef<Set<() => Promise<void>>>(new Set());

  useEffect(() => {
    let wasOffline = !isConnected || !isInternetReachable;

    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? true;
      const reachable = state.isInternetReachable ?? true;
      const isNowOnline = connected && reachable;

      // If we were offline and now we're online, trigger callbacks
      if (wasOffline && isNowOnline) {
        console.log('Device came online, triggering sync callbacks...');
        // Execute all callbacks asynchronously
        onlineCallbacksRef.current.forEach(callback => {
          callback().catch(e => console.error('Sync callback error:', e));
        });
      }

      wasOffline = !isNowOnline;
      setIsConnected(connected);
      setIsInternetReachable(reachable);
    });

    return () => unsubscribe();
  }, []);

  const onOnline = (callback: () => Promise<void>) => {
    onlineCallbacksRef.current.add(callback);
  };

  const offOnline = (callback: () => Promise<void>) => {
    onlineCallbacksRef.current.delete(callback);
  };

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable, onOnline, offOnline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
