import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Input } from '../ui/input';
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
  // State for URL import
  const [season, setSeason] = useState<string>('');
  const [leagueFile, setLeagueFile] = useState<string>('');

  // State for local file import
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localSeason, setLocalSeason] = useState('');
  const [localSourceFile, setLocalSourceFile] = useState('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLocalFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    setStatus('loading');
    setMessage('Importing...');

    try {
      let leagueData;
      let seasonToUse = season;
      let sourceFileToUse = leagueFile;

      if (localFile) {
        // Local file import logic
        setMessage('Reading local file...');
        seasonToUse = localSeason;
        sourceFileToUse = localSourceFile;

        const fileContent = await localFile.text();
        leagueData = JSON.parse(fileContent);
      } else {
        // URL import logic
        setMessage('Fetching data from source...');
        leagueData = await fetchHistoricalLeagueData(season, leagueFile);
      }

      setMessage('Saving data to database...');

      const newLeague = await insertHistoricalLeague({
        name: leagueData.name,
        season: seasonToUse,
        source_file: sourceFileToUse,
      });

      await insertHistoricalMatches(leagueData.matches, newLeague.id);

      setStatus('success');
      setMessage(`Successfully imported ${leagueData.matches.length} matches for ${leagueData.name}.`);
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'An unknown error occurred during import.');
    } finally {
      // Reset file input for re-upload of same file
      const fileInput = document.getElementById('local-file-input') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
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
        <div>
          <p className="text-sm font-medium mb-2">Import from URL</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="season-select" className="block text-xs text-gray-600 mb-1">Season</label>
              <Select id="season-select" value={season} onChange={(e) => setSeason(e.target.value)} disabled={!!localFile}>
                <option value="" disabled>Select a season</option>
                {availableSeasons.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <label htmlFor="league-select" className="block text-xs text-gray-600 mb-1">League</label>
              <Select id="league-select" value={leagueFile} onChange={(e) => setLeagueFile(e.target.value)} disabled={!!localFile}>
                <option value="" disabled>Select a league</option>
                {availableLeagues.map(l => <option key={l.file} value={l.file}>{l.name}</option>)}
              </Select>
            </div>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Import from Local File</p>
          <div className="space-y-2">
            <Input id="local-file-input" type="file" accept=".json" onChange={handleFileChange} disabled={!!(season || leagueFile)} />
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Season (e.g., 2023-24)" value={localSeason} onChange={(e) => setLocalSeason(e.target.value)} disabled={!localFile} />
              <Input placeholder="Source File (e.g., en.1.json)" value={localSourceFile} onChange={(e) => setLocalSourceFile(e.target.value)} disabled={!localFile} />
            </div>
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
        <Button
          onClick={handleImport}
          disabled={
            (!season || !leagueFile) && (!localFile || !localSeason || !localSourceFile) || status === 'loading'
          }
        >
          Import Data
        </Button>
      </CardFooter>
    </Card>
  );
};
