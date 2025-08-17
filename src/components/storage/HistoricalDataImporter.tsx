import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../ui/card';
import { fetchHistoricalLeagueData } from '../../services/historicalDataImporter';
import { insertHistoricalLeague, insertHistoricalMatches } from '../../storage/services/historical';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

// Data that would ideally come from a config file or API
const availableSeasons = [
  '2023-24', '2022-23', '2021-22', '2020-21'
];
const availableLeagues = [
  { name: 'English Premier League', file: 'en.1.json' },
  { name: 'Spanish La Liga', file: 'es.1.json' },
  { name: 'German Bundesliga', file: 'de.1.json' },
  { name: 'Italian Serie A', file: 'it.1.json' },
  { name: 'French Ligue 1', file: 'fr.1.json' },
];

export const HistoricalDataImporter: React.FC = () => {
  const [season, setSeason] = useState<string>('');
  const [leagueFile, setLeagueFile] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleImport = async () => {
    if (!season || !leagueFile) {
      setStatus('error');
      setMessage('Please select a season and a league.');
      return;
    }

    setStatus('loading');
    setMessage('Fetching data from source...');

    try {
      const leagueData = await fetchHistoricalLeagueData(season, leagueFile);

      setMessage('Saving data to database...');

      const newLeague = await insertHistoricalLeague({
        name: leagueData.name,
        season: season,
        source_file: leagueFile,
      });

      await insertHistoricalMatches(leagueData.matches, newLeague.id);

      setStatus('success');
      setMessage(`Successfully imported ${leagueData.matches.length} matches for ${leagueData.name}.`);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'An unknown error occurred during import.');
    }
  };

  return (
    <Card className="historical-data-importer">
      <CardHeader>
        <CardTitle>Import Historical Data</CardTitle>
        <CardDescription>
          Import historical match data from the openfootball/football.json repository.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="season-select" className="text-sm font-medium">Season</label>
            <Select
              id="season-select"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              required
            >
              <option value="" disabled>Select a season</option>
              {availableSeasons.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="league-select" className="text-sm font-medium">League</label>
            <Select
              id="league-select"
              value={leagueFile}
              onChange={(e) => setLeagueFile(e.target.value)}
              required
            >
              <option value="" disabled>Select a league</option>
              {availableLeagues.map(l => (
                <option key={l.file} value={l.file}>{l.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
          {status === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
          <span className="text-sm text-gray-600">{message}</span>
        </div>
        <Button onClick={handleImport} disabled={!season || !leagueFile || status === 'loading'}>
          Import Data
        </Button>
      </CardFooter>
    </Card>
  );
};
