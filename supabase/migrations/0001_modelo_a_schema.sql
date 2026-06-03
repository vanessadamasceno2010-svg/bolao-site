-- Modelo A: schema de producao para BolaoCopa 2026
-- Execute no SQL Editor do Supabase ou via Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique,                 -- login do participante (auth via Supabase Auth)
  email text not null,
  phone text,
  pix_key text,                          -- chave PIX para bônus de indicação
  role text not null default 'participant' check (role in ('participant', 'organizer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.pools (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id),
  slug text not null unique,
  name text not null,
  description text,
  share_value numeric(12,2) not null check (share_value > 0),
  total_shares integer not null check (total_shares > 0),
  deadline timestamptz not null,
  commission_percent numeric(5,2) not null default 12 check (commission_percent >= 0 and commission_percent <= 20),
  referral_bonus_percent numeric(5,2) not null default 5 check (referral_bonus_percent >= 0 and referral_bonus_percent <= 10),
  prize_first_percent numeric(5,2) not null default 50,
  prize_second_percent numeric(5,2) not null default 30,
  prize_third_percent numeric(5,2) not null default 20,
  exact_score_points integer not null default 3,
  correct_draw_points integer not null default 2,
  correct_winner_points integer not null default 1,
  goal_difference_points integer not null default 2,
  status text not null default 'open' check (status in ('open', 'filled', 'closed', 'settled')),
  created_at timestamptz not null default now(),
  constraint prize_sum_100 check ((prize_first_percent + prize_second_percent + prize_third_percent) = 100)
);

create table if not exists public.pool_shares (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools(id) on delete cascade,
  participant_user_id uuid references public.profiles(id),
  participant_name text not null,
  participant_email text not null,
  participant_phone text not null,
  referral_code text not null unique,
  referred_by_share_id uuid references public.pool_shares(id),
  pix_key_for_bonus text,
  quantity integer not null check (quantity > 0),
  total_amount numeric(12,2) not null check (total_amount > 0),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Cada cota (pool_share) de quantidade N gera N bilhetes (tickets).
-- Cada bilhete tem palpites próprios e disputa o ranking de forma independente.
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.pool_shares(id) on delete cascade,
  pool_id uuid not null references public.pools(id) on delete cascade,
  participant_user_id uuid references public.profiles(id),
  ticket_index integer not null check (ticket_index > 0),
  created_at timestamptz not null default now(),
  unique (share_id, ticket_index)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  stage text not null,
  group_name text,
  kickoff_at timestamptz not null,
  home_team text not null,
  away_team text not null,
  home_flag text,
  away_flag text,
  home_score integer,
  away_score integer,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished', 'cancelled')),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ticket_id, match_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools(id) on delete cascade,
  share_id uuid not null references public.pool_shares(id) on delete cascade,
  provider text not null default 'mercado_pago',
  provider_payment_id text unique,
  status text not null default 'pending',
  amount numeric(12,2) not null,
  commission_amount numeric(12,2) not null default 0,
  prize_amount numeric(12,2) not null default 0,
  payment_method text not null default 'pix',
  pix_qr_code text,
  pix_qr_code_base64 text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools(id) on delete cascade,
  share_id uuid not null references public.pool_shares(id) on delete cascade,
  total_points integer not null default 0,
  exact_scores integer not null default 0,
  correct_winners integer not null default 0,
  position integer,
  updated_at timestamptz not null default now(),
  unique (pool_id, share_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid references public.pools(id) on delete cascade,
  recipient_email text not null,
  type text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools(id) on delete cascade,
  referrer_share_id uuid not null references public.pool_shares(id) on delete cascade,
  referred_share_id uuid not null references public.pool_shares(id) on delete cascade,
  referred_name text not null,
  referred_email text not null,
  final_place integer check (final_place in (1, 2, 3)),
  referred_prize_amount numeric(12,2),
  bonus_amount numeric(12,2),
  bonus_paid boolean not null default false,
  bonus_paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (pool_id, referrer_share_id, referred_share_id)
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools(id) on delete cascade,
  organizer_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null check (amount > 0),
  pix_key text not null,
  status text not null default 'requested' check (status in ('requested', 'processing', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_pools_creator on public.pools(creator_id);
create index if not exists idx_pools_slug on public.pools(slug);
create index if not exists idx_pool_shares_pool on public.pool_shares(pool_id);
create index if not exists idx_predictions_share on public.predictions(share_id);
create index if not exists idx_payments_share on public.payments(share_id);
create index if not exists idx_referrals_referrer on public.referrals(referrer_share_id);
create index if not exists idx_referrals_pool on public.referrals(pool_id);
create index if not exists idx_pool_shares_referral_code on public.pool_shares(referral_code);
create index if not exists idx_rankings_pool_position on public.rankings(pool_id, position);
create index if not exists idx_matches_external on public.matches(external_id);

create or replace function public.recalculate_pool_rankings(target_pool_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from public.rankings where pool_id = target_pool_id;

  insert into public.rankings (pool_id, share_id, total_points, exact_scores, correct_winners, position)
  with scored as (
    select
      ps.pool_id,
      ps.id as share_id,
      sum(
        case
          when m.status <> 'finished' then 0
          when p.home_score = m.home_score and p.away_score = m.away_score then pool.exact_score_points
          when p.home_score = p.away_score and m.home_score = m.away_score then pool.correct_draw_points
          when ((p.home_score > p.away_score and m.home_score > m.away_score)
             or (p.home_score < p.away_score and m.home_score < m.away_score))
            then pool.correct_winner_points + case when (p.home_score - p.away_score) = (m.home_score - m.away_score) then pool.goal_difference_points else 0 end
          else 0
        end
      )::integer as total_points,
      sum(case when m.status = 'finished' and p.home_score = m.home_score and p.away_score = m.away_score then 1 else 0 end)::integer as exact_scores,
      sum(case when m.status = 'finished' and (
        (p.home_score > p.away_score and m.home_score > m.away_score) or
        (p.home_score < p.away_score and m.home_score < m.away_score) or
        (p.home_score = p.away_score and m.home_score = m.away_score)
      ) then 1 else 0 end)::integer as correct_winners
    from public.pool_shares ps
    join public.pools pool on pool.id = ps.pool_id
    left join public.predictions p on p.share_id = ps.id
    left join public.matches m on m.id = p.match_id
    where ps.pool_id = target_pool_id and ps.payment_status = 'paid'
    group by ps.pool_id, ps.id
  ), ranked as (
    select *, row_number() over (order by total_points desc, exact_scores desc, correct_winners desc) as rn
    from scored
  )
  select pool_id, share_id, coalesce(total_points, 0), coalesce(exact_scores, 0), coalesce(correct_winners, 0), rn
  from ranked;
end;
$$;

alter table public.profiles enable row level security;
alter table public.pools enable row level security;
alter table public.pool_shares enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.payments enable row level security;
alter table public.rankings enable row level security;
alter table public.notifications enable row level security;
alter table public.referrals enable row level security;
alter table public.withdrawal_requests enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "pools_public_read" on public.pools for select using (true);
create policy "pools_creator_insert" on public.pools for insert with check (auth.uid() = creator_id);
create policy "pools_creator_update" on public.pools for update using (auth.uid() = creator_id);

create policy "shares_pool_public_read" on public.pool_shares for select using (true);
create policy "shares_any_insert" on public.pool_shares for insert with check (true);
create policy "shares_participant_update" on public.pool_shares for update using (auth.uid() = participant_user_id);

create policy "matches_public_read" on public.matches for select using (true);

create policy "predictions_read_paid_share" on public.predictions for select using (true);
create policy "predictions_insert_paid_share" on public.predictions for insert with check (
  exists (select 1 from public.pool_shares ps where ps.id = share_id and ps.payment_status = 'paid')
);
create policy "predictions_update_paid_share" on public.predictions for update using (
  exists (select 1 from public.pool_shares ps where ps.id = share_id and ps.payment_status = 'paid')
);

create policy "payments_read_related" on public.payments for select using (true);
create policy "rankings_public_read" on public.rankings for select using (true);
create policy "notifications_read_own" on public.notifications for select using (recipient_email = auth.jwt() ->> 'email');
create policy "withdrawals_organizer_read" on public.withdrawal_requests for select using (auth.uid() = organizer_id);

create policy "referrals_public_read" on public.referrals for select using (true);
create policy "referrals_insert" on public.referrals for insert with check (
  exists (select 1 from public.pool_shares ps where ps.id = referred_share_id and ps.payment_status = 'paid')
);

create or replace function public.settle_referral_bonuses(target_pool_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  pool_rec record;
  ref_rec  record;
  rank_rec record;
  prize_pct numeric;
  prize_val numeric;
  bonus_val numeric;
  arrecadado numeric;
  prize_pool numeric;
begin
  select * into pool_rec from public.pools where id = target_pool_id;
  select sum(total_amount) into arrecadado from public.pool_shares where pool_id = target_pool_id and payment_status = 'paid';
  prize_pool := arrecadado * (1 - pool_rec.commission_percent / 100);

  for ref_rec in
    select r.*, rk.position
    from public.referrals r
    join public.rankings rk on rk.share_id = r.referred_share_id and rk.pool_id = target_pool_id
    where r.pool_id = target_pool_id and r.bonus_paid = false and rk.position <= 3
  loop
    prize_pct := case ref_rec.position
      when 1 then pool_rec.prize_first_percent
      when 2 then pool_rec.prize_second_percent
      when 3 then pool_rec.prize_third_percent
    end;
    prize_val := prize_pool * prize_pct / 100;
    bonus_val := prize_val * pool_rec.referral_bonus_percent / 100;

    update public.referrals set
      final_place          = ref_rec.position,
      referred_prize_amount= prize_val,
      bonus_amount         = bonus_val,
      bonus_paid           = true,
      bonus_paid_at        = now()
    where id = ref_rec.id;
  end loop;
end;
$$;