/**
 * ═══════════════════════════════════════════════════════
 *  SCRAPER CLIENT — Busca resultados via API-Football
 * ═══════════════════════════════════════════════════════
 *
 *  Consome a Edge Function scrape-matches do Supabase,
 *  que usa a API-Football (plano gratuito: 100 req/dia).
 *
 *  Fallback: se a API falhar, usa dados locais.
 */

import { getSupabase } from './supabase';
import { WORLD_CUP_2026_MATCHES } from '../data/matches';

const SCRAPE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-matches`
  : '';

const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type ApiMatch = {
  external_id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  status: 'scheduled' | 'live' | 'finished' | 'cancelled';
  stage: string;
  group_name: string | null;
  venue: string | null;
};

export const scraperClient = {
  /**
   * Busca todos os jogos. Prioridade:
   * 1. Edge Function (API-Football via Supabase)
   * 2. Supabase banco local
   * 3. Dados locais embutidos no app
   */
  async getMatches(): Promise<ApiMatch[]> {
    // 1. Tentar Edge Function
    if (SCRAPE_URL) {
      try {
        const res = await fetch(SCRAPE_URL, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'apikey': API_KEY ?? '',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.ok && data.data?.length > 0) return data.data;
        }
      } catch (err) {
        console.warn('Edge Function indisponível:', err);
      }
    }

    // 2. Tentar banco Supabase direto
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('match_date');
        if (!error && data && data.length > 0) return data as ApiMatch[];
      }
    } catch {}

    // 3. Fallback: dados locais
    return WORLD_CUP_2026_MATCHES.map(m => ({
      external_id: m.id,
      home_team: m.homeTeam,
      away_team: m.awayTeam,
      home_score: m.homeScore ?? null,
      away_score: m.awayScore ?? null,
      match_date: m.date,
      status: (m.finished ? 'finished' : 'scheduled') as ApiMatch['status'],
      stage: m.stage,
      group_name: m.group ?? null,
      venue: null,
    }));
  },

  async getLiveMatches(): Promise<ApiMatch[]> {
    if (!SCRAPE_URL) return [];
    try {
      const res = await fetch(`${SCRAPE_URL}?live=true`, {
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'apikey': API_KEY ?? '' },
      });
      if (res.ok) {
        const data = await res.json();
        return data.data ?? [];
      }
    } catch {}
    return [];
  },
};
