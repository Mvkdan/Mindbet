import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_CONFIG } from './endpoints';
import { logger } from '../../lib/logger';

class RateLimiter {
  private requests: number = 0;
  private lastReset: number = Date.now();
  private dailyRequests: number = 0;
  private dailyReset: number = new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000;

  async checkLimit(): Promise<void> {
    const now = Date.now();

    // Réinitialiser le compteur par minute
    if (now - this.lastReset >= 60 * 1000) {
      this.requests = 0;
      this.lastReset = now;
    }

    // Réinitialiser le compteur quotidien
    if (now >= this.dailyReset) {
      this.dailyRequests = 0;
      this.dailyReset = new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000;
    }

    if (this.requests >= API_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE) {
      const waitTime = 60 * 1000 - (now - this.lastReset);
      logger.warn('RateLimiter', `Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requests = 0;
      this.lastReset = Date.now();
    }

    if (this.dailyRequests >= API_CONFIG.RATE_LIMIT.REQUESTS_PER_DAY) {
      const waitTime = this.dailyReset - now;
      logger.warn('RateLimiter', `Daily limit reached, waiting ${waitTime}ms`);
      throw new Error('Daily API limit reached');
    }

    this.requests++;
    this.dailyRequests++;
  }
}

export class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private rateLimiter: RateLimiter;

  private constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.VITE_FOOTBALL_API_KEY
      }
    });

    this.rateLimiter = new RateLimiter();

    // Intercepteur pour la gestion des limites
    this.client.interceptors.request.use(async config => {
      await this.rateLimiter.checkLimit();
      return config;
    });

    // Intercepteur pour la gestion des erreurs
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          logger.error('ApiClient', 'API Error Response', {
            status: error.response.status,
            data: error.response.data
          });
        } else if (error.request) {
          logger.error('ApiClient', 'API Request Error', error.request);
        } else {
          logger.error('ApiClient', 'API Error', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.get<T>(url, { params });
      return response.data;
    } catch (error) {
      logger.error('ApiClient', `GET ${url} failed`, error);
      throw error;
    }
  }
}

export const apiClient = ApiClient.getInstance();