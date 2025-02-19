import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  X, Activity, Users, Clock, MapPin, Trophy, Info, 
  DollarSign, Star, TrendingUp, Shirt 
} from 'lucide-react';
import { api } from '../lib/api';
import { LoadingState } from './LoadingState';
import type { Match, FixtureStatistics, FixtureEvent, FixtureLineup, Odds } from '../types';

interface MatchDetailsProps {
  match: Match;
  onClose: () => void;
}

interface MatchData {
  statistics: FixtureStatistics[];
  events: FixtureEvent[];
  lineups: FixtureLineup[];
  odds: Odds[];
  error: string | null;
}

export const MatchDetails: React.FC<MatchDetailsProps> = ({ match, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData>({
    statistics: [],
    events: [],
    lineups: [],
    odds: [],
    error: null
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'lineups' | 'events' | 'odds'>('overview');

  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        const data = await api.fixtures.getAllMatchData(match.fixture.id);
        setMatchData(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchData();
  }, [match.fixture.id]);

  const renderStatistics = () => {
    if (!matchData.statistics.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <Activity className="w-8 h-8 text-gray-400" />
          <p className="text-gray-500">Statistiques non disponibles pour ce match</p>
          <p className="text-sm text-gray-400">Les statistiques peuvent ne pas être disponibles pour certains championnats</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {matchData.statistics[0]?.statistics.map((stat, index) => (
          <div key={index} className="flex items-center">
            <div className="w-1/3 text-right pr-4">
              <div className="font-medium">{matchData.statistics[0]?.statistics[index]?.value || '0'}</div>
              <div className="h-2 bg-gray-200 rounded-full mt-1">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${(Number(matchData.statistics[0]?.statistics[index]?.value) /
                      (Number(matchData.statistics[0]?.statistics[index]?.value) +
                        Number(matchData.statistics[1]?.statistics[index]?.value))) *
                      100}%`,
                  }}
                />
              </div>
            </div>
            <div className="w-1/3 text-center text-sm text-gray-600">{stat.type}</div>
            <div className="w-1/3 pl-4">
              <div className="font-medium">{matchData.statistics[1]?.statistics[index]?.value || '0'}</div>
              <div className="h-2 bg-gray-200 rounded-full mt-1">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${(Number(matchData.statistics[1]?.statistics[index]?.value) /
                      (Number(matchData.statistics[0]?.statistics[index]?.value) +
                        Number(matchData.statistics[1]?.statistics[index]?.value))) *
                      100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLineups = () => {
    if (!matchData.lineups.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <Users className="w-8 h-8 text-gray-400" />
          <p className="text-gray-500">Compositions non disponibles pour ce match</p>
          <p className="text-sm text-gray-400">Les compositions peuvent ne pas être disponibles pour certains championnats</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-8">
        {matchData.lineups.map((lineup, index) => (
          <div key={index} className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold">{lineup.team.name}</h3>
              <p className="text-sm text-gray-500">Formation: {lineup.formation}</p>
            </div>

            <div>
              <h4 className="font-medium mb-3">Titulaires</h4>
              <div className="space-y-2">
                {lineup.startXI.map((player, playerIndex) => (
                  <div key={playerIndex} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                    <Shirt className="w-4 h-4 text-gray-400" />
                    <span className="w-6 text-center">{player.player.number}</span>
                    <span className="font-medium flex-1">{player.player.name}</span>
                    <span className="text-sm text-gray-500">{player.player.pos}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Remplaçants</h4>
              <div className="space-y-2">
                {lineup.substitutes.map((player, playerIndex) => (
                  <div key={playerIndex} className="flex items-center space-x-2 text-gray-500 p-2">
                    <Shirt className="w-4 h-4 text-gray-300" />
                    <span className="w-6 text-center">{player.player.number}</span>
                    <span className="flex-1">{player.player.name}</span>
                    <span className="text-sm">{player.player.pos}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEvents = () => {
    if (!matchData.events.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <Star className="w-8 h-8 text-gray-400" />
          <p className="text-gray-500">Temps forts non disponibles pour ce match</p>
          <p className="text-sm text-gray-400">Les temps forts peuvent ne pas être disponibles pour certains championnats</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {matchData.events.map((event, index) => (
          <div
            key={index}
            className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg"
          >
            <div className="w-16 text-center">
              <div className="font-bold text-lg">{event.time.elapsed}'</div>
              {event.time.extra && (
                <div className="text-sm text-gray-500">+{event.time.extra}</div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <img
                  src={event.team.logo}
                  alt={event.team.name}
                  className="w-6 h-6 object-contain"
                />
                <span className="font-medium">{event.team.name}</span>
              </div>
              <div className="mt-1 text-sm">
                <span className="font-medium">{event.player.name}</span>
                {event.assist && (
                  <span className="text-gray-500">
                    {' '}
                    (Assist: {event.assist.name})
                  </span>
                )}
                <div className="text-gray-600">
                  {event.type} - {event.detail}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOdds = () => {
    if (!matchData.odds.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-2">
          <DollarSign className="w-8 h-8 text-gray-400" />
          <p className="text-gray-500">Cotes non disponibles pour ce match</p>
          <p className="text-sm text-gray-400">Les cotes peuvent ne pas être disponibles pour certains championnats</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchData.odds.map((bookmaker) => (
          <div key={bookmaker.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">{bookmaker.name}</span>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            {bookmaker.bets?.[0]?.values && (
              <div className="grid grid-cols-3 gap-3">
                {bookmaker.bets[0].values.map((value) => (
                  <div
                    key={value.value}
                    className="bg-white rounded-lg border border-gray-200 p-3 text-center"
                  >
                    <div className="text-sm text-gray-500 mb-1">{value.value}</div>
                    <div className="text-lg font-bold text-green-600">{value.odd}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
          <LoadingState message="Chargement des détails du match..." />
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <Info className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Impossible de charger les détails
            </h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <img
                src={match.league.logo}
                alt={match.league.name}
                className="w-10 h-10 object-contain"
              />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{match.league.name}</h2>
                <p className="text-sm text-gray-500">
                  {format(new Date(match.fixture.date), 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={match.teams.home.logo}
                alt={match.teams.home.name}
                className="w-16 h-16 object-contain"
              />
              <div className="text-center">
                <p className="font-bold text-lg">{match.teams.home.name}</p>
                <p className="text-3xl font-bold text-gray-900">{match.goals.home ?? '-'}</p>
              </div>
            </div>
            <div className="text-center px-4">
              <div className="text-sm text-gray-500 mb-2">
                {match.fixture.status.elapsed && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    {match.fixture.status.elapsed}'
                  </span>
                )}
              </div>
              <p className="text-lg font-medium text-gray-500">VS</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="font-bold text-lg">{match.teams.away.name}</p>
                <p className="text-3xl font-bold text-gray-900">{match.goals.away ?? '-'}</p>
              </div>
              <img
                src={match.teams.away.logo}
                alt={match.teams.away.name}
                className="w-16 h-16 object-contain"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Info className="w-4 h-4 inline-block mr-2" />
              Aperçu
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline-block mr-2" />
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('lineups')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'lineups'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Compositions
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="w-4 h-4 inline-block mr-2" />
              Temps forts
            </button>
            <button
              onClick={() => setActiveTab('odds')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'odds'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline-block mr-2" />
              Cotes
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Informations</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-5 h-5 mr-3" />
                      <span>
                        {format(new Date(match.fixture.date), 'HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-3" />
                      <span>{match.fixture.venue.name}</span>
                    </div>
                    {match.fixture.referee && (
                      <div className="flex items-center text-gray-600">
                        <Users className="w-5 h-5 mr-3" />
                        <span>Arbitre: {match.fixture.referee}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Score détaillé</h3>
                  <div className="space-y-3">
                    {match.score.halftime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mi-temps</span>
                        <span className="font-medium">
                          {match.score.halftime.home ?? 0} - {match.score.halftime.away ?? 0}
                        </span>
                      </div>
                    )}
                    {match.score.fulltime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Temps réglementaire</span>
                        <span className="font-medium">
                          {match.score.fulltime.home ?? 0} - {match.score.fulltime.away ?? 0}
                        </span>
                      </div>
                    )}
                    {match.score.extratime && match.score.extratime.home !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Prolongations</span>
                        <span className="font-medium">
                          {match.score.extratime.home} - {match.score.extratime.away}
                        </span>
                      </div>
                    )}
                    {match.score.penalty && match.score.penalty.home !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tirs au but</span>
                        <span className="font-medium">
                          {match.score.penalty.home} - {match.score.penalty.away}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && renderStatistics()}
          {activeTab === 'lineups' && renderLineups()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'odds' && renderOdds()}
        </div>
      </div>
    </div>
  );
};