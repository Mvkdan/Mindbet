import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
            <Select onValueChange={setSeason} value={season}>
              <SelectTrigger id="season-select">
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {availableSeasons.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="league-select" className="text-sm font-medium">League</label>
            <Select onValueChange={setLeagueFile} value={leagueFile}>
              <SelectTrigger id="league-select">
                <SelectValue placeholder="Select a league" />
              </SelectTrigger>
              <SelectContent>
                {availableLeagues.map(l => (
                  <SelectItem key={l.file} value={l.file}>{l.name}</SelectItem>
                ))}
              </SelectContent>
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
