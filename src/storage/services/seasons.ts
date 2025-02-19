import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ApiResponse } from '../types';

export interface Season {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: {
    fixtures: {
      events: boolean;
      lineups: boolean;
      statistics_fixtures: boolean;
      statistics_players: boolean;
    };
    standings: boolean;
    players: boolean;
    top_scorers: boolean;
    predictions: boolean;
    odds: boolean;
  };
}

export const seasonsService = {
  /**
   * Récupère la liste des saisons disponibles
   */
  getAll: async (): Promise<Season[]> => {
    const response = await apiClient.get<ApiResponse<Season>>(ENDPOINTS.SEASONS.LIST);
    return response.response;
  },

  /**
   * Récupère la saison en cours
   */
  getCurrent: async (): Promise<Season> => {
    const response = await apiClient.get<ApiResponse<Season>>(ENDPOINTS.SEASONS.CURRENT);
    return response.response[0];
  }
};