import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { logger } from '../lib/logger';
import type { Player, Team, League } from '../types';

interface ImportProgress {
  total: number;
  current: number;
  success: number;
  failed: number;
  lastBatchId?: number;
  errors: Array<{
    playerId?: number;
    error: string;
    details?: any;
  }>;
}

interface ImportOptions {
  batchSize?: number;
  startFromBatch?: number;
  onProgress?: (progress: ImportProgress) => void;
}

const BATCH_SIZE = 200;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000;

export class PlayerImportService {
  private progress: ImportProgress = {
    total: 0,
    current: 0,
    success: 0,
    failed: 0,
    errors: []
  };

  private onProgress?: (progress: ImportProgress) => void;

  constructor(private options: ImportOptions = {}) {
    this.onProgress = options.onProgress;
  }

  private updateProgress(update: Partial<ImportProgress>) {
    this.progress = { ...this.progress, ...update };
    if (this.onProgress) {
      this.onProgress(this.progress);
    }
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    retryCount = RETRY_ATTEMPTS
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount > 0) {
        logger.warn('PlayerImport', `Retry attempt ${RETRY_ATTEMPTS - retryCount + 1}`, { error });
        await this.delay(RETRY_DELAY);
        return this.retryOperation(operation, retryCount - 1);
      }
      throw error;
    }
  }

  private async fetchTeamsAndLeagues(): Promise<{ teams: Team[]; leagues: League[] }> {
    try {
      const [teamsResponse, leaguesResponse] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.from('leagues').select('*')
      ]);

      if (teamsResponse.error) throw teamsResponse.error;
      if (leaguesResponse.error) throw leaguesResponse.error;

      return {
        teams: teamsResponse.data || [],
        leagues: leaguesResponse.data || []
      };
    } catch (error) {
      logger.error('PlayerImport', 'Error fetching teams and leagues', error);
      throw new Error('Failed to fetch teams and leagues data');
    }
  }

  private async importPlayerBatch(
    players: any[],
    teams: Team[],
    leagues: League[]
  ): Promise<void> {
    const playersToInsert = players.map(player => {
      try {
        // Trouver l'équipe et la ligue correspondantes
        const team = teams.find(t => t.id === player.statistics?.[0]?.team?.id);
        const league = leagues.find(l => l.id === player.statistics?.[0]?.league?.id);

        if (!team || !league) {
          throw new Error(`Missing team or league reference for player ${player.id}`);
        }

        // Extraire et normaliser les données du joueur
        const playerData = {
          id: player.id,
          name: player.name || `${player.firstname} ${player.lastname}`,
          firstname: player.firstname,
          lastname: player.lastname,
          nationality: player.nationality,
          birthdate: player.birth?.date,
          photo: player.photo,
          height: player.height,
          weight: player.weight,
          team_id: team.id,
          league_id: league.id,
          position: player.statistics?.[0]?.games?.position,
          last_season: player.statistics?.[0]?.league?.season,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Valider les données requises
        if (!playerData.id || !playerData.name) {
          throw new Error('Missing required player data');
        }

        return playerData;
      } catch (error) {
        this.updateProgress({
          failed: this.progress.failed + 1,
          errors: [...this.progress.errors, {
            playerId: player.id,
            error: 'Data validation error',
            details: error
          }]
        });
        return null;
      }
    }).filter(Boolean);

    if (playersToInsert.length > 0) {
      try {
        const { error } = await supabase
          .from('players')
          .upsert(playersToInsert, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) throw error;

        this.updateProgress({
          success: this.progress.success + playersToInsert.length
        });
      } catch (error) {
        logger.error('PlayerImport', 'Batch insert error', error);
        this.updateProgress({
          failed: this.progress.failed + playersToInsert.length,
          errors: [...this.progress.errors, {
            error: 'Batch insert failed',
            details: error
          }]
        });
      }
    }
  }

  public async importPlayers(): Promise<ImportProgress> {
    try {
      logger.info('PlayerImport', 'Starting player import');
      
      // Récupérer les équipes et les ligues
      const { teams, leagues } = await this.fetchTeamsAndLeagues();
      
      // Initialiser la progression
      this.updateProgress({
        total: 0,
        current: 0,
        success: 0,
        failed: 0,
        errors: []
      });

      let currentBatch = this.options.startFromBatch || 0;
      let hasMoreData = true;

      while (hasMoreData) {
        try {
          // Récupérer un lot de joueurs
          const players = await this.retryOperation(async () => {
            const response = await api.players.getByBatch(
              currentBatch,
              this.options.batchSize || BATCH_SIZE
            );
            return response;
          });

          if (!players || players.length === 0) {
            hasMoreData = false;
            continue;
          }

          // Mettre à jour la progression
          this.updateProgress({
            total: this.progress.total + players.length,
            current: this.progress.current + players.length,
            lastBatchId: currentBatch
          });

          // Importer le lot de joueurs
          await this.importPlayerBatch(players, teams, leagues);

          // Sauvegarder la position du dernier lot traité
          await supabase
            .from('import_state')
            .upsert({
              type: 'players',
              last_batch: currentBatch,
              last_updated: new Date().toISOString()
            });

          currentBatch++;

          // Respecter le rate limiting
          await this.delay(1000);
        } catch (error) {
          logger.error('PlayerImport', `Error processing batch ${currentBatch}`, error);
          
          this.updateProgress({
            errors: [...this.progress.errors, {
              error: `Batch ${currentBatch} failed`,
              details: error
            }]
          });

          // Si l'erreur est liée au rate limiting, attendre plus longtemps
          if (error.response?.status === 429) {
            await this.delay(60000);
          }
        }
      }

      logger.info('PlayerImport', 'Import completed', this.progress);
      return this.progress;
    } catch (error) {
      logger.error('PlayerImport', 'Import failed', error);
      throw error;
    }
  }

  public async resumeImport(): Promise<ImportProgress> {
    try {
      // Récupérer le dernier état d'import
      const { data: importState, error } = await supabase
        .from('import_state')
        .select('*')
        .eq('type', 'players')
        .single();

      if (error) throw error;

      // Reprendre depuis le dernier lot traité
      return this.importPlayers({
        ...this.options,
        startFromBatch: importState?.last_batch + 1 || 0
      });
    } catch (error) {
      logger.error('PlayerImport', 'Resume import failed', error);
      throw error;
    }
  }
}