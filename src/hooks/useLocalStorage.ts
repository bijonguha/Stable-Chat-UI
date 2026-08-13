import { useState, useCallback, useEffect } from 'react';

// Same-tab subscribers per key, so independent useLocalStorage(key) instances
// (e.g. two components both reading 'responseTimeStats') stay in sync without
// waiting for a remount. The browser 'storage' event only fires cross-tab.
const listeners = new Map<string, Set<(value: unknown) => void>>();

function notify(key: string, value: unknown) {
  listeners.get(key)?.forEach(fn => fn(value));
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    const handler = (value: unknown) => setStoredValue(value as T);
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key)!.add(handler);
    return () => {
      listeners.get(key)!.delete(handler);
    };
  }, [key]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue == null) return;
      try {
        setStoredValue(JSON.parse(e.newValue));
      } catch {
        // Ignore malformed cross-tab writes.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      localStorage.setItem(key, JSON.stringify(valueToStore));
      notify(key, valueToStore);
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}
