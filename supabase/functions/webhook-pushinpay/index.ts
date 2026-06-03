/**
 * ═══════════════════════════════════════════════════════
 *  WEBHOOK PUSHINPAY — Corrigido + Seguro
 * ═══════════════════════════════════════════════════════
 *
 *  Correções aplicadas:
 *   ✅ Tabela correta: pool_shares (não "shares")
 *   ✅ Validação de token secreto no header
 *   ✅ Cria tickets automaticamente
 *   ✅ Registra referral se houver
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  // ── SEGURANÇA: validar secret ──
  const WEBHOOK_SECRET = Deno.env.get('PUSHIN_WEBHOOK_SECRET');
  if (WEBHOOK_SECRET) {
    const incomingSecret = req.headers.get('x-webhook-secret');
    if (incomingSecret !== WEBHOOK_SECRET) {
      console.warn('Webhook: secret inválido');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const payload = await req.json();
    console.log('Webhook PushinPay:', JSON.stringify(payload));

    const txId: string = payload.id;
    const status: string = payload.status; // 'created' | 'paid' | 'canceled'
    const endToEnd: string | null = payload.end_to_end_id ?? null;

    if (!txId) {
      return new Response(JSON.stringify({ error: 'Missing id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Atualizar pagamento
    const { data: payment, error: payErr } = await supabase
      .from('payments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('provider_payment_id', txId)
      .select('*, pool_shares!inner(*)')
      .single();

    if (payErr || !payment) {
      console.error('Pagamento não encontrado:', payErr);
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Se pago, ativar share e criar tickets
    if (status === 'paid') {
      const share = payment.pool_shares as any;

      if (share && share.payment_status !== 'paid') {
        // Ativar share
        await supabase
          .from('pool_shares')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', payment.share_id);

        // Criar tickets (idempotente)
        const { count: existing } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('share_id', payment.share_id);

        if (!existing || existing === 0) {
          const tickets = Array.from({ length: share.quantity }, (_, i) => ({
            share_id: payment.share_id,
            pool_id: payment.pool_id,
            participant_user_id: share.participant_user_id,
            ticket_index: i + 1,
          }));
          await supabase.from('tickets').insert(tickets);
        }

        // Registrar referral
        if (share.referred_by_share_id) {
          await supabase.from('referrals').insert({
            pool_id: payment.pool_id,
            referrer_share_id: share.referred_by_share_id,
            referred_share_id: payment.share_id,
            referred_name: share.participant_name,
            referred_email: share.participant_email,
          }).select().maybeSingle();
        }

        // Notificação
        await supabase.from('notifications').insert({
          pool_id: payment.pool_id,
          recipient_email: share.participant_email,
          type: 'payment_confirmed',
          status: 'sent',
          payload: {
            participant_name: share.participant_name,
            quantity: share.quantity,
            total_amount: share.total_amount,
          },
          sent_at: new Date().toISOString(),
        });

        console.log(`✅ Share ${share.id} ativado, ${share.quantity} tickets criados`);
      }
    }

    return new Response(
      JSON.stringify({ received: true, txId, status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
