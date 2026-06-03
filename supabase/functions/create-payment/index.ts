/**
 * ═══════════════════════════════════════════════════════
 *  CREATE PAYMENT — Edge Function (Supabase)
 * ═══════════════════════════════════════════════════════
 *
 *  O frontend chama esta função. Ela:
 *   1. Calcula o valor total
 *   2. Chama a PushinPay no backend (token NUNCA no frontend)
 *   3. Salva o pagamento no banco
 *   4. Retorna QR Code real + transaction_id
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const PUSHIN_TOKEN = Deno.env.get('PUSHIN_PAY_TOKEN');
  if (!PUSHIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'PushinPay token not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const {
      pool_id,
      quantity,
      user_id,
      referred_by_share_id,   // ← NOVO
      pix_key_for_bonus,      // ← NOVO
    } = body as {
      pool_id: string;
      quantity: number;
      user_id: string;
      referred_by_share_id?: string;
      pix_key_for_bonus?: string;
    };

    if (!pool_id || !quantity || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing fields: pool_id, quantity, user_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Buscar o bolão
    const { data: pool, error: poolErr } = await supabase
      .from('pools')
      .select('*')
      .eq('id', pool_id)
      .single();

    if (poolErr || !pool) {
      return new Response(JSON.stringify({ error: 'Pool not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Verificar vagas
    const { count: soldCount } = await supabase
      .from('pool_shares')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', pool_id)
      .eq('payment_status', 'paid');

    const remaining = pool.total_shares - (soldCount ?? 0);
    if (quantity > remaining) {
      return new Response(JSON.stringify({ error: `Only ${remaining} shares left` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Calcular valor
    const totalAmount = quantity * pool.share_value;
    const amountCents = Math.round(totalAmount * 100);
    const commissionAmount = totalAmount * (pool.commission_percent / 100);
    const prizeAmount = totalAmount - commissionAmount;

    // 4. Buscar perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Criar pool_share pendente
    const referralCode = (profile.full_name ?? 'user')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 6) + Math.random().toString(36).slice(2, 5).toUpperCase();

    // Validação opcional: se referrer foi enviado, verificar que existe
    if (referred_by_share_id) {
      const { data: refCheck } = await supabase
        .from('pool_shares')
        .select('id')
        .eq('id', referred_by_share_id)
        .single();

      if (!refCheck) {
        // Referrer inválido — ignora silenciosamente
        console.warn('referrer share não encontrado, ignorando');
      }
    }

    const { data: share, error: shareErr } = await supabase
      .from('pool_shares')
      .insert({
        pool_id,
        participant_user_id: user_id,
        participant_name: profile.full_name,
        participant_email: profile.email,
        participant_phone: profile.phone ?? '',
        referral_code: referralCode,
        referred_by_share_id: referred_by_share_id || null,  // ← NOVO
        pix_key_for_bonus: pix_key_for_bonus || null,         // ← NOVO
        quantity,
        total_amount: totalAmount,
        payment_status: 'pending',
      })
      .select()
      .single();

    if (shareErr || !share) {
      return new Response(JSON.stringify({ error: 'Failed to create share', details: shareErr }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Chamar PushinPay para gerar PIX
    const webhookUrl = Deno.env.get('WEBHOOK_URL') ?? '';

    const mpResponse = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PUSHIN_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        value: amountCents,
        webhook_url: webhookUrl || undefined,
      }),
    });

    if (!mpResponse.ok) {
      const errBody = await mpResponse.text();
      console.error('PushinPay error:', errBody);
      // Reverter share criado
      await supabase.from('pool_shares').delete().eq('id', share.id);
      return new Response(JSON.stringify({ error: 'PushinPay error', details: errBody }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pix = await mpResponse.json();

    // 7. Salvar pagamento no banco
    await supabase.from('payments').insert({
      pool_id,
      share_id: share.id,
      provider: 'pushinpay',
      provider_payment_id: pix.id,
      status: pix.status ?? 'created',
      amount: totalAmount,
      commission_amount: commissionAmount,
      prize_amount: prizeAmount,
      payment_method: 'pix',
      pix_qr_code: pix.qr_code,
      pix_qr_code_base64: pix.qr_code_base64,
    });

    // 8. Retornar dados reais para o frontend
    return new Response(
      JSON.stringify({
        ok: true,
        transaction_id: pix.id,
        qr_code: pix.qr_code,
        qr_code_base64: pix.qr_code_base64,
        share_id: share.id,
        amount: totalAmount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('create-payment error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
