import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '../lib/logger';

interface DataLoaderState<T> {
  data: T;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

interface DataLoaderConfig<T> {
  initialData: T;
  loadData: () => Promise<T>;
  refreshInterval?: number;
  onError?: (error: any) => void;
}

export function useDataLoader<T>({
  initialData,
  loadData,
  refreshInterval,
  onError
}: DataLoaderConfig<T>) {
  const [state, setState] = useState<DataLoaderState<T>>({
    data: initialData,
    isLoading: true,
    error: null,
    lastUpdate: null
  });

  const isFirstRender = useRef(true);
  const timeoutRef = useRef<number>();

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const newData = await loadData();
      setState({
        data: newData,
        isLoading: false,
        error: null,
        lastUpdate: new Date()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      if (onError) onError(error);
      logger.error('DataLoader', 'Error loading data:', error);
    }
  }, [loadData, onError]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      refresh();
    }

    if (refreshInterval) {
      timeoutRef.current = window.setInterval(refresh, refreshInterval);
      return () => {
        if (timeoutRef.current) {
          clearInterval(timeoutRef.current);
        }
      };
    }
  }, [refresh, refreshInterval]);

  return {
    ...state,
    refresh
  };
}