import { useCallback } from 'react';
import { CacheEntry } from '../types';

const cache = new Map<string, CacheEntry<any>>();

export const useCache = () => {
  const get = useCallback(<T>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  const set = useCallback(<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }, []);

  const clear = useCallback((key?: string) => {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  }, []);

  return { get, set, clear };
};