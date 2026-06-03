/**
 * ═══════════════════════════════════════════════════════
 *  SUPABASE CLIENT — Inicialização lazy (não crasha)
 * ═══════════════════════════════════════════════════════
 *
 *  O cliente só é criado quando realmente necessário.
 *  Se as variáveis não existem, retorna null (modo offline/demo).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !key || url.includes('SEU_PROJETO') || key.includes('SUA_')) {
    return null; // Variáveis não configuradas — modo offline
  }
  if (!_client) {
    _client = createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }
  return _client;
}

/** Lança erro se Supabase não estiver configurado. */
export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    throw new Error(
      'Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env'
    );
  }
  return client;
}

/** Verifica se o Supabase está disponível. */
export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
