import { apiClient } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import type { ApiResponse, Match } from '../types';

export interface MatchEvent {
  time: {
    elapsed: number;
    extra?: number;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number;
    name: string;
  };
  assist: {
    id: number;
    name: string;
  } | null;
  type: string;
  detail: string;
  comments: string | null;
}

export interface MatchLineup {
  team: {
    id: number;
    name: string;
    logo: string;
    colors: {
      player: { primary: string; number: string; border: string };
      goalkeeper: { primary: string; number: string; border: string };
    };
  };
  formation: string;
  startXI: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: string;
    };
  }>;
  substitutes: Array<{
    player: {
      id: number;
      name: string;
      number: number;
      pos: string;
      grid: null;
    };
  }>;
  coach: {
    id: number;
    name: string;
    photo: string;
  };
}

export interface MatchStatistics {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

export const matchesService = {
  /**
   * Récupère la liste des matchs
   * @param date Date au format YYYY-MM-DD
   */
  getByDate: async (date: string): Promise<Match[]> => {
    const response = await apiClient.get<ApiResponse<Match>>(
      ENDPOINTS.MATCHES.BY_DATE(date)
    );
    return response.response;
  },

  /**
   * Récupère les matchs en direct
   */
  getLive: async (): Promise<Match[]> => {
    const response = await apiClient.get<ApiResponse<Match>>(ENDPOINTS.MATCHES.LIVE);
    return response.response;
  },

  /**
   * Récupère un match par son ID
   */
  getById: async (id: number): Promise<Match> => {
    const response = await apiClient.get<ApiResponse<Match>>(ENDPOINTS.MATCHES.BY_ID(id));
    return response.response[0];
  },

  /**
   * Récupère les confrontations directes entre deux équipes
   */
  getHeadToHead: async (team1: number, team2: number): Promise<Match[]> => {
    const response = await apiClient.get<ApiResponse<Match>>(
      ENDPOINTS.MATCHES.HEAD_TO_HEAD(team1, team2)
    );
    return response.response;
  },

  /**
   * Récupère les statistiques d'un match
   */
  getStatistics: async (id: number): Promise<MatchStatistics[]> => {
    const response = await apiClient.get<ApiResponse<MatchStatistics>>(
      ENDPOINTS.MATCHES.STATISTICS(id)
    );
    return response.response;
  },

  /**
   * Récupère les événements d'un match
   */
  getEvents: async (id: number): Promise<MatchEvent[]> => {
    const response = await apiClient.get<ApiResponse<MatchEvent>>(
      ENDPOINTS.MATCHES.EVENTS(id)
    );
    return response.response;
  },

  /**
   * Récupère les compositions d'équipe d'un match
   */
  getLineups: async (id: number): Promise<MatchLineup[]> => {
    const response = await apiClient.get<ApiResponse<MatchLineup>>(
      ENDPOINTS.MATCHES.LINEUPS(id)
    );
    return response.response;
  }
};