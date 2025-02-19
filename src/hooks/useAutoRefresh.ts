import { useState, useCallback } from 'react';
import { logger } from '../lib/logger';

interface AutoRefreshConfig {
  onRefresh: () => Promise<void>;
  onError?: (error: any) => void;
}

interface AutoRefreshState {
  isRefreshing: boolean;
  lastUpdate: Date | null;
  error: Error | null;
}

export const useAutoRefresh = ({
  onRefresh,
  onError
}: AutoRefreshConfig) => {
  const [state, setState] = useState<AutoRefreshState>({
    isRefreshing: false,
    lastUpdate: null,
    error: null
  });

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRefreshing: true, error: null }));
      logger.info('AutoRefresh', 'Starting manual refresh');

      await onRefresh();

      setState(prev => ({
        ...prev,
        isRefreshing: false,
        lastUpdate: new Date(),
        error: null
      }));
      
      logger.info('AutoRefresh', 'Manual refresh completed');
    } catch (error) {
      logger.error('AutoRefresh', 'Error during refresh', error);
      
      setState(prev => ({
        ...prev,
        isRefreshing: false,
        error: error as Error
      }));

      if (onError) {
        onError(error);
      }
    }
  }, [onRefresh, onError]);

  return {
    ...state,
    refresh
  };
};