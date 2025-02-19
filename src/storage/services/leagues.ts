import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ApiResponse, League } from '../types';

export interface LeagueStanding {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

export const leaguesService = {
  /**
   * Récupère la liste des ligues
   * @param country Filtre optionnel par pays
   */
  getAll: async (country?: string): Promise<League[]> => {
    const response = await apiClient.get<ApiResponse<League>>(ENDPOINTS.LEAGUES.LIST, {
      country
    });
    return response.response;
  },

  /**
   * Récupère une ligue par son ID
   */
  getById: async (id: number): Promise<League> => {
    const response = await apiClient.get<ApiResponse<League>>(ENDPOINTS.LEAGUES.BY_ID(id));
    return response.response[0];
  },

  /**
   * Récupère le classement d'une ligue
   */
  getStandings: async (id: number, season: number): Promise<LeagueStanding[][]> => {
    const response = await apiClient.get<ApiResponse<{ standings: LeagueStanding[][] }>>(
      ENDPOINTS.LEAGUES.STANDINGS(id, season)
    );
    return response.response[0].standings;
  }
};