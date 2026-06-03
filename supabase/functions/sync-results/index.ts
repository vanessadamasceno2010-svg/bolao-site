import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const apiKey = Deno.env.get('API_FOOTBALL_KEY')!;

  const apiResponse = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
    headers: { 'x-apisports-key': apiKey },
  });
  const data = await apiResponse.json();
  if (!apiResponse.ok) return json({ error: 'API-Football error', details: data }, 400);

  const fixtures = data.response ?? [];
  let changed = 0;

  for (const f of fixtures) {
    const status = f.fixture?.status?.short === 'FT' ? 'finished'
      : ['1H', 'HT', '2H', 'ET', 'P'].includes(f.fixture?.status?.short) ? 'live'
      : 'scheduled';

    const row = {
      external_id: String(f.fixture.id),
      stage: f.league?.round ?? 'World Cup',
      kickoff_at: f.fixture.date,
      home_team: f.teams?.home?.name ?? 'Home',
      away_team: f.teams?.away?.name ?? 'Away',
      home_score: f.goals?.home,
      away_score: f.goals?.away,
      status,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('matches').upsert(row, { onConflict: 'external_id' });
    if (!error && status === 'finished') changed++;
  }

  const { data: pools } = await supabase.from('pools').select('id').in('status', ['open', 'filled', 'closed']);
  for (const pool of pools ?? []) {
    await supabase.rpc('recalculate_pool_rankings', { target_pool_id: pool.id });
  }

  return json({ ok: true, fixtures: fixtures.length, finishedUpdated: changed, poolsRecalculated: pools?.length ?? 0 });
});