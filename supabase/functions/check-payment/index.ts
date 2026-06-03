/**
 * ═══════════════════════════════════════════════════════
 *  CHECK PAYMENT — Polling do frontend
 * ═══════════════════════════════════════════════════════
 *
 *  O frontend chama esta função a cada 5 segundos
 *  para verificar se o pagamento foi confirmado.
 *  Consulta a PushinPay + atualiza banco se necessário.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const PUSHIN_TOKEN = Deno.env.get('PUSHIN_PAY_TOKEN')!;

  try {
    const url = new URL(req.url);
    const txId = url.searchParams.get('tx_id');

    if (!txId) {
      return new Response(JSON.stringify({ error: 'Missing tx_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Consultar PushinPay
    const ppRes = await fetch(`https://api.pushinpay.com.br/api/transactions/${txId}`, {
      headers: {
        Authorization: `Bearer ${PUSHIN_TOKEN}`,
        Accept: 'application/json',
      },
    });

    if (!ppRes.ok) {
      return new Response(JSON.stringify({ error: 'PushinPay query failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ppData = await ppRes.json();
    const status = ppData.status; // 'created' | 'paid' | 'canceled'

    // 2. Atualizar pagamento no banco
    await supabase
      .from('payments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('provider_payment_id', txId);

    // 3. Se pago, ativar share e criar tickets
    if (status === 'paid') {
      const { data: payment } = await supabase
        .from('payments')
        .select('share_id, pool_id, pool_shares!inner(*)')
        .eq('provider_payment_id', txId)
        .single();

      if (payment) {
        const share = payment.pool_shares as any;

        // Ativar share
        await supabase
          .from('pool_shares')
          .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', payment.share_id)
          .eq('payment_status', 'pending'); // só se ainda pendente

        // Criar tickets (bilhetes) — idempotente
        const { count: existingTickets } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('share_id', payment.share_id);

        if (!existingTickets || existingTickets === 0) {
          const tickets = Array.from({ length: share.quantity }, (_, i) => ({
            share_id: payment.share_id,
            pool_id: payment.pool_id,
            participant_user_id: share.participant_user_id,
            ticket_index: i + 1,
          }));
          await supabase.from('tickets').insert(tickets);
        }

        // Registrar referral se houver
        if (share.referred_by_share_id) {
          await supabase.from('referrals').insert({
            pool_id: payment.pool_id,
            referrer_share_id: share.referred_by_share_id,
            referred_share_id: payment.share_id,
            referred_name: share.participant_name,
            referred_email: share.participant_email,
          }).select().maybeSingle();
        }
      }
    }

    return new Response(
      JSON.stringify({ status, transaction_id: txId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('check-payment error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
