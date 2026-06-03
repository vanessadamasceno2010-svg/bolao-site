/**
 * ═══════════════════════════════════════════════════════
 *  PUSHIN PAY — Cliente frontend (SEM TOKEN)
 * ═══════════════════════════════════════════════════════
 *
 *  O token da PushinPay NUNCA fica no frontend.
 *  Todas as chamadas vão para Edge Functions do Supabase
 *  que guardam o token em Supabase Secrets.
 *
 *  Fluxo:
 *   Frontend → POST /functions/v1/create-payment (Supabase)
 *   Supabase → POST /api/pix/cashIn (PushinPay)
 *   Supabase ← QR Code real
 *   Frontend ← QR Code real
 */

import { getSupabase } from './supabase';

export type CreatePaymentPayload = {
  pool_id: string;
  quantity: number;
  user_id: string;
  referred_by_share_id?: string;
  pix_key_for_bonus?: string;
};

export type CreatePaymentResult = {
  ok: boolean;
  transaction_id: string;
  qr_code: string;           // código copia-e-cola PIX
  qr_code_base64: string;    // imagem do QR Code em base64
  share_id: string;          // ← ID criado pela Edge Function
  amount: number;
  error?: string;
};

export type CheckPaymentResult = {
  status: 'created' | 'paid' | 'canceled';
  transaction_id: string;
};

export const pushinPay = {
  /**
   * Cria um pagamento PIX via Edge Function.
   * A Edge Function já cria o pool_share internamente —
   * NÃO criar share no frontend (evita duplicação).
   *
   * O token da PushinPay fica seguro no Supabase Secrets.
   */
  async createPixPayment(payload: CreatePaymentPayload): Promise<CreatePaymentResult> {
    const supabase = getSupabase();
    const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
        },
        body: JSON.stringify(payload),
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Erro ao criar pagamento');
    return data as CreatePaymentResult;
  },

  /**
   * Verifica se o pagamento foi confirmado.
   * Usado para polling a cada 5 segundos.
   */
  async checkPayment(transactionId: string): Promise<CheckPaymentResult> {
    const supabase = getSupabase();
    const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-payment?tx_id=${transactionId}`,
      {
        headers: {
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
        },
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Erro ao verificar pagamento');
    return data as CheckPaymentResult;
  },

  /**
   * Formata centavos para R$.
   */
  formatAmount(cents: number): string {
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  },

  /**
   * Converte reais para centavos.
   */
  toCents(reais: number): number {
    return Math.round(reais * 100);
  },
};
