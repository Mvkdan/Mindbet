import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Database, Search, Folder, Table } from 'lucide-react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'table';
  children?: TreeNode[];
}

const databaseStructure: TreeNode[] = [
  {
    id: 'leagues',
    name: 'Leagues',
    type: 'folder',
    children: [
      { id: 'leagues-table', name: 'leagues', type: 'table' },
      { id: 'league-standings', name: 'league_standings', type: 'table' }
    ]
  },
  {
    id: 'teams',
    name: 'Teams',
    type: 'folder',
    children: [
      { id: 'teams-table', name: 'teams', type: 'table' },
      { id: 'team-statistics', name: 'team_statistics', type: 'table' }
    ]
  },
  {
    id: 'players',
    name: 'Players',
    type: 'folder',
    children: [
      { id: 'players-table', name: 'players', type: 'table' },
      { id: 'player-statistics', name: 'player_statistics', type: 'table' }
    ]
  },
  {
    id: 'matches',
    name: 'Matches',
    type: 'folder',
    children: [
      { id: 'matches-table', name: 'matches', type: 'table' },
      { id: 'match-events', name: 'match_events', type: 'table' },
      { id: 'match-statistics', name: 'match_statistics', type: 'table' },
      { id: 'match-lineups', name: 'match_lineups', type: 'table' }
    ]
  }
];

interface TreeItemProps {
  node: TreeNode;
  level: number;
  onSelect: (node: TreeNode) => void;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  searchTerm: string;
}

const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  onSelect,
  expanded,
  onToggle,
  searchTerm
}) => {
  const isExpanded = expanded.has(node.id);
  const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
  const hasMatchingChildren = node.children?.some(child =>
    child.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (searchTerm && !matchesSearch && !hasMatchingChildren) {
    return null;
  }

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer ${
          level > 0 ? 'ml-4' : ''
        }`}
        onClick={() => {
          if (node.type === 'folder') {
            onToggle(node.id);
          } else {
            onSelect(node);
          }
        }}
      >
        {node.type === 'folder' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <Folder className="w-4 h-4 text-blue-500 ml-1 mr-2" />
          </>
        ) : (
          <div className="w-4 h-4 ml-5 mr-2">
            <Table className="w-4 h-4 text-green-500" />
          </div>
        )}
        <span className="text-sm">{node.name}</span>
      </div>
      {isExpanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface StorageNavigatorProps {
  onSelectTable: (tableName: string) => void;
}

export const StorageNavigator: React.FC<StorageNavigatorProps> = ({ onSelectTable }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['leagues']));
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const handleSelect = (node: TreeNode) => {
    if (node.type === 'table') {
      onSelectTable(node.name);
    }
  };

  return (
    <Card className="p-4 h-full">
      <div className="flex items-center space-x-2 mb-4">
        <Database className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-semibold">Structure de la base</h2>
      </div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {databaseStructure.map(node => (
          <TreeItem
            key={node.id}
            node={node}
            level={0}
            onSelect={handleSelect}
            expanded={expanded}
            onToggle={handleToggle}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </Card>
  );
};