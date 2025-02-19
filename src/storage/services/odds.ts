import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ApiResponse, Odds } from '../types';

export interface Bookmaker {
  id: number;
  name: string;
}

export interface BetType {
  id: number;
  name: string;
}

export const oddsService = {
  /**
   * Récupère les cotes pour un match
   */
  getByFixture: async (id: number): Promise<Odds> => {
    const response = await apiClient.get<ApiResponse<Odds>>(
      ENDPOINTS.ODDS.BY_FIXTURE(id)
    );
    return response.response[0];
  },

  /**
   * Récupère les cotes en direct
   */
  getLive: async (): Promise<Odds[]> => {
    const response = await apiClient.get<ApiResponse<Odds>>(ENDPOINTS.ODDS.LIVE);
    return response.response;
  },

  /**
   * Récupère la liste des bookmakers disponibles
   */
  getBookmakers: async (): Promise<Bookmaker[]> => {
    const response = await apiClient.get<ApiResponse<Bookmaker>>(
      ENDPOINTS.ODDS.BOOKMAKERS
    );
    return response.response;
  },

  /**
   * Récupère la liste des types de paris disponibles
   */
  getBetTypes: async (): Promise<BetType[]> => {
    const response = await apiClient.get<ApiResponse<BetType>>(ENDPOINTS.ODDS.BETS);
    return response.response;
  }
};