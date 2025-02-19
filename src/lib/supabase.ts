import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'football-stats-portal'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add error handling and retry logic for Supabase operations
export const supabaseWithRetry = {
  async query<T>(
    operation: () => Promise<{ data: T | null; error: any }>
  ): Promise<T> {
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { data, error } = await operation();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('No data returned');
        }

        return data;
      } catch (error) {
        lastError = error;
        logger.error('Supabase', `Query attempt ${attempt} failed`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
      }
    }

    throw lastError;
  }
};