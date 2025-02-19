import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number | null): string {
  return score === null ? '-' : score.toString();
}

export function getMatchStatus(status: string, elapsed?: number): string {
  if (status === 'LIVE' && elapsed) {
    return `${elapsed}'`;
  }
  
  const statusMap: Record<string, string> = {
    'NS': 'À venir',
    'LIVE': 'En direct',
    'HT': 'Mi-temps',
    'FT': 'Terminé',
    'PST': 'Reporté',
    'CANC': 'Annulé',
    'ABD': 'Abandonné',
    'AWD': 'Victoire technique',
    'WO': 'Forfait',
  };

  return statusMap[status] || status;
}