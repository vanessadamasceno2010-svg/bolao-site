/**
 * ═══════════════════════════════════════════════════════
 *  DB — Camada de acesso ao banco Supabase (segura)
 * ═══════════════════════════════════════════════════════
 *
 *  Usa getSupabase() que retorna null se não configurado.
 *  NÃO crasha no import se as variáveis não existirem.
 */

import { getSupabase, isSupabaseConfigured } from './supabase';
import type { User as SupaUser } from '@supabase/supabase-js';

/** Helper que lança erro se Supabase não estiver disponível. */
function db() {
  const client = getSupabase();
  if (!client) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
  return client;
}

/* ── Auth ── */

export async function signUp(name: string, email: string, password: string, phone: string, username: string) {
  const { data, error } = await db().auth.signUp({
    email,
    password,
    options: { data: { name, phone, username } },
  });
  if (error) throw error;

  if (data.user) {
    await db().from('profiles').upsert({
      id: data.user.id,
      full_name: name,
      email,
      phone,
      username,
    });
  }
  return data.user;
}

export async function signIn(usernameOrEmail: string, password: string) {
  let { data, error } = await db().auth.signInWithPassword({
    email: usernameOrEmail,
    password,
  });

  if (error) {
    const { data: profile } = await db()
      .from('profiles')
      .select('email')
      .eq('username', usernameOrEmail)
      .single();

    if (profile) {
      ({ data, error } = await db().auth.signInWithPassword({
        email: profile.email,
        password,
      }));
    }
  }

  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await db().auth.signOut();
}

export async function getCurrentUser(): Promise<SupaUser | null> {
  if (!isSupabaseConfigured()) return null;
  const { data } = await db().auth.getUser();
  return data.user;
}

export async function getProfile(userId: string) {
  const { data } = await db()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function updateProfile(userId: string, updates: {
  full_name?: string;
  phone?: string;
  pix_key?: string;
}) {
  const { error } = await db().from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await db().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/#/perfil`,
  });
  if (error) throw error;
}

/* ── Pools (Bolões) ── */

export async function getPools() {
  const { data } = await db().from('pools').select('*').order('created_at', { ascending: false });
  return data ?? [];
}

export async function getPoolBySlug(slug: string) {
  const { data } = await db().from('pools').select('*').eq('slug', slug).single();
  return data;
}

export async function getPoolById(id: string) {
  const { data } = await db().from('pools').select('*').eq('id', id).single();
  return data;
}

export async function createPool(pool: Record<string, unknown>) {
  const { data, error } = await db().from('pools').insert({ ...pool, status: 'open' }).select().single();
  if (error) throw error;
  return data;
}

export async function getMyPools(organizerId: string) {
  const { data } = await db()
    .from('pools')
    .select('*')
    .eq('creator_id', organizerId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

/* ── Pool Shares (Cotas) ── */

export async function createPoolShare(share: Record<string, unknown>) {
  const { data, error } = await db()
    .from('pool_shares')
    .insert({ ...share, payment_status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSharesByPool(poolId: string) {
  const { data } = await db().from('pool_shares').select('*').eq('pool_id', poolId);
  return data ?? [];
}

export async function getSharesByUser(userId: string) {
  const { data } = await db()
    .from('pool_shares')
    .select('*, pools(*)')
    .eq('participant_user_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function getUserShareInPool(userId: string, poolId: string) {
  const { data } = await db()
    .from('pool_shares')
    .select('*')
    .eq('participant_user_id', userId)
    .eq('pool_id', poolId)
    .maybeSingle();
  return data;
}

export async function getShareByReferralCode(code: string) {
  const { data } = await db()
    .from('pool_shares')
    .select('*')
    .eq('referral_code', code)
    .single();
  return data;
}

/* ── Tickets ── */

export async function createTickets(shareId: string, poolId: string, userId: string, quantity: number) {
  const tickets = Array.from({ length: quantity }, (_, i) => ({
    share_id: shareId,
    pool_id: poolId,
    participant_user_id: userId,
    ticket_index: i + 1,
  }));
  const { data, error } = await db().from('tickets').insert(tickets).select();
  if (error) throw error;
  return data ?? [];
}

export async function getTicketsByShare(shareId: string) {
  const { data } = await db().from('tickets').select('*').eq('share_id', shareId).order('ticket_index');
  return data ?? [];
}

/* ── Predictions ── */

export async function savePrediction(ticketId: string, matchId: string, homeScore: number, awayScore: number) {
  const { error } = await db().from('predictions').upsert(
    { ticket_id: ticketId, match_id: matchId, home_score: homeScore, away_score: awayScore },
    { onConflict: 'ticket_id,match_id' },
  );
  if (error) throw error;
}

export async function getPredictionsByTicket(ticketId: string) {
  const { data } = await db().from('predictions').select('*').eq('ticket_id', ticketId);
  return data ?? [];
}

/* ── Matches ── */

export async function getMatches() {
  const { data } = await db().from('matches').select('*').order('kickoff_at');
  return data ?? [];
}

/* ── Payments ── */

export async function createPayment(payment: Record<string, unknown>) {
  const { error } = await db().from('payments').insert({
    ...payment,
    provider: 'pushinpay',
    status: 'pending',
    payment_method: 'pix',
  });
  if (error) throw error;
}

/* ── Referrals ── */

export async function createReferral(ref: Record<string, unknown>) {
  const { error } = await db().from('referrals').insert(ref);
  if (error) throw error;
}

export async function getReferralsByReferrer(shareId: string) {
  const { data } = await db().from('referrals').select('*').eq('referrer_share_id', shareId);
  return data ?? [];
}

/* ── Ranking ── */

export async function getRanking(poolId: string) {
  const { data } = await db()
    .from('rankings')
    .select('*, pool_shares(*, profiles(*))')
    .eq('pool_id', poolId)
    .order('position');
  return data ?? [];
}

export async function recalculateRanking(poolId: string) {
  const { error } = await db().rpc('recalculate_pool_rankings', { target_pool_id: poolId });
  if (error) throw error;
}

/* ── Notifications ── */

export async function insertNotification(notification: Record<string, unknown>) {
  const { error } = await db().from('notifications').insert({
    ...notification,
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/* ── Utilitários ── */

export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

export function makeReferralCode(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '').slice(0, 6) +
    Math.random().toString(36).slice(2, 5).toUpperCase();
}

export function formatBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export { isSupabaseConfigured };
