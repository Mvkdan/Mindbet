import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  History,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { LoadingState } from '../components/LoadingState';
import type { Match, League, Team } from '../types';

interface MatchFilters {
  league: string;
  team: string;
  month: string;
}

// Utiliser uniquement l'export nommé
export function MatchHistory() {
  // ... (le reste du code reste identique)
}