/**
 * ═══════════════════════════════════════════════════════
 *  SCRAPE MATCHES — API-Football (plano gratuito)
 * ═══════════════════════════════════════════════════════
 *
 *  Usa o plano gratuito da API-Football (100 req/dia).
 *  external_id é o fixture_id real da API (estável, sem duplicatas).
 *
 *  GET  /scrape-matches            → todos os jogos da Copa
 *  GET  /scrape-matches?live=true  → apenas ao vivo
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const API_FOOTBALL_URL = 'https://v3.football.api-sports.io';

// Mapeamento de status da API-Football para nosso formato
const STATUS_MAP: Record<string, string> = {
  'NS': 'scheduled',
  '1H': 'live',
  'HT': 'live',
  '2H': 'live',
  'ET': 'live',
  'P':  'live',
  'FT': 'finished',
  'AET': 'finished',
  'PEN': 'finished',
  'CANC': 'cancelled',
  'ABD': 'cancelled',
  'PST': 'cancelled',
};

// Mapeamento de rounds para nosso formato
const ROUND_MAP: Record<string, string> = {
  'Group Stage':     'Fase de Grupos',
  'Round of 32':     '32 avos',
  'Round of 16':     'Oitavas de Final',
  'Quarter-finals':  'Quartas de Final',
  'Semi-finals':     'Semifinais',
  '3rd Place Final': 'Disputa 3º Lugar',
  'Final':           'Final',
};

function extractGroup(round: string): string | null {
  const m = round.match(/Group\s+([A-Z])/i);
  return m ? m[1] : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('API_FOOTBALL_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API_FOOTBALL_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const url = new URL(req.url);
    const isLive = url.searchParams.get('live') === 'true';

    // Chamar API-Football
    const apiUrl = new URL(`${API_FOOTBALL_URL}/fixtures`);
    apiUrl.searchParams.set('league', '1');   // World Cup
    apiUrl.searchParams.set('season', '2026');
    if (isLive) apiUrl.searchParams.set('live', 'all');

    const apiRes = await fetch(apiUrl.toString(), {
      headers: { 'x-apisports-key': apiKey },
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('API-Football error:', errText);
      return new Response(JSON.stringify({ error: 'API-Football error', details: errText }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiData = await apiRes.json();
    const fixtures = apiData.response ?? [];

    // Converter para nosso formato
    const rows = fixtures.map((f: any) => ({
      external_id: String(f.fixture.id),
      home_team:   f.teams.home.name,
      away_team:   f.teams.away.name,
      home_score:  f.goals.home,
      away_score:  f.goals.away,
      match_date:  f.fixture.date,
      status:      STATUS_MAP[f.fixture.status.short] ?? 'scheduled',
      stage:       ROUND_MAP[f.league.round] ?? f.league.round,
      group_name:  extractGroup(f.league.round),
      venue:       f.fixture.venue?.name ?? null,
      updated_at:  new Date().toISOString(),
    }));

    // Upsert no Supabase (external_id é estável — não duplica)
    let upserted = 0;
    if (rows.length > 0) {
      const { error, count } = await supabase
        .from('matches')
        .upsert(rows, { onConflict: 'external_id', count: 'exact' });

      if (error) {
        console.error('Supabase upsert error:', error);
      } else {
        upserted = count ?? rows.length;
      }

      // Recalcular rankings se houver jogos finalizados
      const hasFinished = rows.some((r: any) => r.status === 'finished');
      if (hasFinished) {
        const { data: pools } = await supabase
          .from('pools')
          .select('id')
          .in('status', ['open', 'filled', 'closed']);

        for (const pool of pools ?? []) {
          await supabase.rpc('recalculate_pool_rankings', {
            target_pool_id: pool.id,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        source: 'api-football',
        matches_found: rows.length,
        upserted_to_db: upserted,
        data: rows,
        remaining_requests: apiData.remaining ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('scrape-matches error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
