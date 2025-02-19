import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ApiResponse, Player, PlayerStatistics } from '../types';

export interface TopScorer extends Player {
  statistics: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    goals: {
      total: number;
      assists: number;
    };
    games: {
      appearences: number;
      minutes: number;
    };
  }>;
}

export const playersService = {
  /**
   * Récupère la liste des joueurs
   * @param team Filtre par équipe
   * @param season Filtre par saison
   */
  getAll: async (team?: number, season?: number): Promise<Player[]> => {
    const response = await apiClient.get<ApiResponse<Player>>(ENDPOINTS.PLAYERS.LIST, {
      team,
      season
    });
    return response.response;
  },

  /**
   * Récupère un joueur par son ID
   */
  getById: async (id: number): Promise<Player> => {
    const response = await apiClient.get<ApiResponse<Player>>(ENDPOINTS.PLAYERS.BY_ID(id));
    return response.response[0];
  },

  /**
   * Récupère les statistiques d'un joueur
   */
  getStatistics: async (id: number, season: number): Promise<PlayerStatistics> => {
    const response = await apiClient.get<ApiResponse<PlayerStatistics>>(
      ENDPOINTS.PLAYERS.STATISTICS(id, season)
    );
    return response.response[0];
  },

  /**
   * Récupère les saisons disponibles pour un joueur
   */
  getSeasons: async (id: number): Promise<number[]> => {
    const response = await apiClient.get<ApiResponse<number>>(
      ENDPOINTS.PLAYERS.SEASONS(id)
    );
    return response.response;
  },

  /**
   * Récupère les meilleurs buteurs d'une ligue
   */
  getTopScorers: async (league: number, season: number): Promise<TopScorer[]> => {
    const response = await apiClient.get<ApiResponse<TopScorer>>(
      ENDPOINTS.PLAYERS.TOP_SCORERS(league, season)
    );
    return response.response;
  }
};