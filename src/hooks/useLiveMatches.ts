import { useDataLoader } from './useDataLoader';
import { api } from '../lib/api';
import type { Match } from '../types';

export function useLiveMatches() {
  return useDataLoader<Match[]>({
    initialData: [], // Initialize with empty array
    loadData: () => api.matches.getLive(),
    refreshInterval: 30000, // Refresh every 30 seconds
    onError: (error) => {
      console.error('Error fetching live matches:', error);
    }
  });
}