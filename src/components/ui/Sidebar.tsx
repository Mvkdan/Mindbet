import React from 'react';
import { NavLink } from 'react-router-dom';
import { Star, Trophy, Calendar } from 'lucide-react';
import type { League } from '../../types';

interface SidebarProps {
  leagues: League[];
  selectedLeague?: number;
  onSelectLeague: (leagueId: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  leagues,
  selectedLeague,
  onSelectLeague,
}) => {
  return (
    <div className="w-64 bg-gray-900 text-white h-screen overflow-y-auto">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-6">Football Live</h1>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
              <Star className="w-4 h-4" />
              <span>Favoris</span>
            </div>
            <div className="space-y-1">
              <NavLink
                to="/live"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-2 py-1.5 rounded-md ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
                  }`
                }
              >
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>En direct</span>
              </NavLink>
              <NavLink
                to="/today"
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-2 py-1.5 rounded-md ${
                    isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
                  }`
                }
              >
                <Calendar className="w-4 h-4" />
                <span>Aujourd'hui</span>
              </NavLink>
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
              <Trophy className="w-4 h-4" />
              <span>Compétitions</span>
            </div>
            <div className="space-y-1">
              {leagues.map((league) => (
                <button
                  key={league.id}
                  onClick={() => onSelectLeague(league.id)}
                  className={`flex items-center space-x-2 w-full px-2 py-1.5 rounded-md ${
                    selectedLeague === league.id
                      ? 'bg-blue-600'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="w-4 h-4 object-contain"
                  />
                  <span className="text-sm">{league.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};