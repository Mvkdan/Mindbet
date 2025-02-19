import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ApiResponse, Team, TeamStatistics } from '../types';

export const teamsService = {
  /**
   * Récupère la liste des équipes
   * @param league Filtre par ligue
   * @param season Filtre par saison
   */
  getAll: async (league?: number, season?: number): Promise<Team[]> => {
    const response = await apiClient.get<ApiResponse<Team>>(ENDPOINTS.TEAMS.LIST, {
      league,
      season
    });
    return response.response;
  },

  /**
   * Récupère une équipe par son ID
   */
  getById: async (id: number): Promise<Team> => {
    const response = await apiClient.get<ApiResponse<Team>>(ENDPOINTS.TEAMS.BY_ID(id));
    return response.response[0];
  },

  /**
   * Récupère les statistiques d'une équipe
   */
  getStatistics: async (id: number, league: number, season: number): Promise<TeamStatistics> => {
    const response = await apiClient.get<ApiResponse<TeamStatistics>>(
      ENDPOINTS.TEAMS.STATISTICS(id, league, season)
    );
    return response.response[0];
  },

  /**
   * Récupère les saisons disponibles pour une équipe
   */
  getSeasons: async (id: number): Promise<number[]> => {
    const response = await apiClient.get<ApiResponse<number>>(ENDPOINTS.TEAMS.SEASONS(id));
    return response.response;
  }
};