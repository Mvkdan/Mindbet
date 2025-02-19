import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import {
  Calendar,
  Loader2,
  Settings as SettingsIcon,
  DollarSign,
  LogOut,
  LayoutDashboard,
  TrendingUp,
  Users,
  Trophy,
  Activity,
  Menu,
  X,
  History
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { Dashboard } from './components/Dashboard';
import { LiveMatches } from './pages/LiveMatches';
import { Competitions } from './components/Competitions';
import { PlayersPage } from './pages/Players';
import { Statistics } from './pages/Statistics';
import { MatchHistory } from './pages/MatchHistory';
import { Odds } from './components/Odds';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { ChatBot } from './components/ChatBot/ChatBot';

export default function App() {
  const [session, setSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      checkAdminStatus(session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      checkAdminStatus(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string | undefined) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Activity, label: 'Matchs en direct', path: '/matches' },
    { icon: History, label: 'Historique', path: '/history' },
    { icon: Trophy, label: 'Compétitions', path: '/competitions' },
    { icon: Users, label: 'Joueurs', path: '/players' },
    { icon: TrendingUp, label: 'Statistiques', path: '/stats' },
    { icon: DollarSign, label: 'Cotes', path: '/odds' },
    { icon: SettingsIcon, label: 'Paramètres', path: '/settings' },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {session ? (
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div className={`${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between px-4 py-6">
                  <Link to="/" className="text-xl font-bold text-white">
                    Football Live
                  </Link>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden text-white hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <nav className="flex-1 space-y-1 px-2 py-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="border-t border-gray-800 p-4">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-auto">
              <header className="bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-4 lg:px-8">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-gray-500 hover:text-gray-600"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </div>
              </header>

              <main className="p-4 lg:p-8">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/matches" element={<LiveMatches />} />
                  <Route path="/history" element={<MatchHistory />} />
                  <Route path="/competitions" element={<Competitions />} />
                  <Route path="/players" element={<PlayersPage isAdmin={isAdmin} />} />
                  <Route path="/stats" element={<Statistics />} />
                  <Route path="/odds" element={<Odds />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/login" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Chatbot */}
              <ChatBot />
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}