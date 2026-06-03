import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const accessToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN')!;

  const payload = await req.json().catch(() => ({}));
  const paymentId = payload?.data?.id ?? payload?.id ?? new URL(req.url).searchParams.get('id');
  if (!paymentId) return json({ received: true, ignored: 'missing payment id' });

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payment = await mpResponse.json();
  if (!mpResponse.ok) return json({ error: 'Could not fetch payment', details: payment }, 400);

  const shareId = payment.external_reference;
  const status = payment.status;

  await supabase
    .from('payments')
    .update({ status, raw_payload: payment, updated_at: new Date().toISOString() })
    .eq('provider_payment_id', String(payment.id));

  if (status === 'approved' && shareId) {
    await supabase
      .from('pool_shares')
      .update({ payment_status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', shareId);

    const { data: share } = await supabase
      .from('pool_shares')
      .select('pool_id, participant_email, participant_name, pools(name)')
      .eq('id', shareId)
      .single();

    if (share) {
      await supabase.from('notifications').insert({
        pool_id: share.pool_id,
        recipient_email: share.participant_email,
        type: 'payment_confirmed',
        payload: { participantName: share.participant_name, poolName: share.pools?.name },
      });

      // Registra indicação se esta cota foi referred por alguém
      if (share.referred_by_share_id) {
        await supabase.from('referrals').insert({
          pool_id: share.pool_id,
          referrer_share_id: share.referred_by_share_id,
          referred_share_id: share.id,
          referred_name: share.participant_name,
          referred_email: share.participant_email,
        }).onConflict('pool_id, referrer_share_id, referred_share_id').ignore();
      }
    }
  }

  return json({ received: true, paymentId, status });
});