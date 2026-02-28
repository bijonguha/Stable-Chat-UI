import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { ResponseTimeStats } from '../types/api';

const MAX_TIMES = 50;

export function useResponseTimeStats() {
  const [stats, setStats] = useLocalStorage<ResponseTimeStats>('responseTimeStats', {});

  const recordResponseTime = useCallback((endpointId: string, responseTime: number) => {
    setStats(prev => {
      const endpointStats = prev[endpointId] || { times: [], total: 0, count: 0 };
      const times = [...endpointStats.times];
      if (times.length >= MAX_TIMES) {
        times.shift();
      }
      times.push(responseTime);
      return {
        ...prev,
        [endpointId]: {
          times,
          total: endpointStats.total + responseTime,
          count: endpointStats.count + 1,
        },
      };
    });
  }, [setStats]);

  const getAverageResponseTime = useCallback((endpointId: string): number | null => {
    const endpointStats = stats[endpointId];
    if (!endpointStats || endpointStats.times.length === 0) return null;
    const sum = endpointStats.times.reduce((acc, t) => acc + t, 0);
    return Math.round(sum / endpointStats.times.length);
  }, [stats]);

  const clearResponseTimes = useCallback((endpointId: string) => {
    setStats(prev => {
      const next = { ...prev };
      delete next[endpointId];
      return next;
    });
  }, [setStats]);

  return { recordResponseTime, getAverageResponseTime, clearResponseTimes };
}
