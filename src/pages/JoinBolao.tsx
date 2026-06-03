/**
 * ═══════════════════════════════════════════════════════
 *  JOIN BOLÃO — Checkout REAL com PushinPay + Supabase
 * ═══════════════════════════════════════════════════════
 *
 *  ✅ SEM simulatePay()
 *  ✅ SEM QR Code falso
 *  ✅ SEM makePixCode()
 *  ✅ SEM cartão (PushinPay = PIX only)
 *  ✅ SEM localStorage — tudo no Supabase
 *  ✅ Token PushinPay fica no backend (Edge Function)
 *  ✅ Polling real a cada 5s para verificar pagamento
 */

import { useEffect, useRef, useState } from 'react';
import { Button, Card, Input } from '../components/Layout';
import { Confetti } from '../components/Confetti';
import { navigate } from '../lib/router';
import { pushinPay } from '../lib/pushin-pay';
import { toast } from '../lib/toast';
import {
  getPoolBySlug,
  getShareByReferralCode,
  getUserShareInPool,
  getCurrentUser,
  formatBRL,
  signIn,
  signUp,
  getProfile,
} from '../lib/db';
import type { User as SupaUser } from '@supabase/supabase-js';

type Step = 'form' | 'payment' | 'success';

function getRefCode(): string {
  const hash = window.location.hash;
  const q = hash.includes('?') ? hash.split('?')[1] : '';
  return new URLSearchParams(q).get('ref') ?? '';
}

export function JoinBolao({ slug }: { slug: string }) {
  const [pool, setPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('form');
  const [user, setUser] = useState<SupaUser | null>(null);

  // Form state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]  = useState('');
  const [pixBonus, setPixBonus] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [agreed, setAgreed]    = useState(false);

  // Login fields
  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');

  // Payment state
  const [transactionId, setTransactionId] = useState('');
  const [qrCodeBase64, setQrCodeBase64]   = useState('');
  const [pixCode, setPixCode]             = useState('');
  const [shareId, setShareId]             = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'canceled'>('pending');
  // paymentStatus é atualizado pelo polling mas usado apenas internamente
  void paymentStatus;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [secondsLeft, setSecondsLeft]     = useState(300);

  // Referral
  const refCode = getRefCode();
  const [referrerShare, setReferrerShare] = useState<any>(null);

  // Carregar bolão e usuário
  useEffect(() => {
    (async () => {
      try {
        const p = await getPoolBySlug(slug);
        setPool(p);
        const u = await getCurrentUser();
        if (u) {
          setUser(u);
          const profile = await getProfile(u.id);
          if (profile) {
            setName(profile.full_name);
            setEmail(profile.email);
            setPhone(profile.phone ?? '');
          }
        }
        if (refCode) {
          const ref = await getShareByReferralCode(refCode);
          setReferrerShare(ref);
        }
      } catch (err: any) {
        toast.error('Erro', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  // Polling de pagamento
  useEffect(() => {
    if (step !== 'payment' || !transactionId) return;

    const timer = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const result = await pushinPay.checkPayment(transactionId);
        if (result.status === 'paid') {
          setPaymentStatus('paid');
          setStep('success');
          if (pollRef.current) clearInterval(pollRef.current);
          clearInterval(timer);
          toast.success('Pagamento confirmado!', 'Sua participação foi ativada.');
        } else if (result.status === 'canceled') {
          setPaymentStatus('canceled');
          if (pollRef.current) clearInterval(pollRef.current);
          clearInterval(timer);
          toast.error('Pagamento cancelado.');
        }
      } catch {}
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearInterval(timer);
    };
  }, [step, transactionId]);

  if (loading) {
    return (
      <Card className="p-12 text-center max-w-lg mx-auto">
        <div className="text-4xl mb-3 animate-pulse">⏳</div>
        <p className="text-slate-400">Carregando bolão...</p>
      </Card>
    );
  }

  if (!pool) {
    return (
      <Card className="p-12 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-3">🤔</div>
        <h2 className="text-xl font-bold">Bolão não encontrado</h2>
        <Button className="mt-4" onClick={() => navigate('/')}>Home</Button>
      </Card>
    );
  }

  const total = quantity * pool.share_value;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const u = await signIn(loginId, loginPw);
      setUser(u);
      const profile = await getProfile(u!.id);
      if (profile) {
        setName(profile.full_name);
        setEmail(profile.email);
        setPhone(profile.phone ?? '');
      }
      toast.success(`Bem-vindo, ${profile?.full_name?.split(' ')[0] ?? 'participante'}!`);
    } catch (err: any) {
      toast.error('Login inválido', err.message);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) { toast.warning('Senha', 'Mínimo 4 caracteres.'); return; }
    if (password !== confirm) { toast.warning('As senhas não conferem.'); return; }
    try {
      const u = await signUp(name, email, password, phone, username);
      setUser(u);
      toast.success('Conta criada!', 'Agora complete seu pagamento.');
    } catch (err: any) {
      toast.error('Erro', err.message);
    }
  }

  async function handleProceed(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { toast.warning('Termos', 'Aceite os termos para continuar.'); return; }
    if (!user) { toast.warning('Faça login ou crie uma conta primeiro.'); return; }

    try {
      // ⚠️  NÃO criar share aqui no frontend!
      // A Edge Function create-payment já cria o share internamente.
      // Criar aqui causaria DUPLICAÇÃO.

      // Se já tem share pago, bloquear
      const existing = await getUserShareInPool(user.id, pool.id);
      if (existing?.payment_status === 'paid') {
        toast.info('Você já participa deste bolão!');
        navigate('/perfil');
        return;
      }

      // Criar pagamento PIX via Edge Function.
      // A Edge Function:
      //   1. Cria o share com referred_by_share_id e pix_key_for_bonus
      //   2. Gera o PIX na PushinPay
      //   3. Salva o pagamento
      //   4. Retorna share_id + QR Code
      const result = await pushinPay.createPixPayment({
        pool_id: pool.id,
        quantity,
        user_id: user.id,
        referred_by_share_id: referrerShare?.id,    // ← envia referrer
        pix_key_for_bonus: pixBonus || undefined,   // ← envia chave PIX
      });
      setTransactionId(result.transaction_id);
      setQrCodeBase64(result.qr_code_base64);
      setPixCode(result.qr_code);
      setShareId(result.share_id);
      setStep('payment');
      toast.info('PIX gerado!', 'Escaneie ou copie o código para pagar.');
    } catch (err: any) {
      toast.error('Erro ao processar', err.message);
    }
  }

  /* ═══ STEP: FORM ═══ */
  if (step === 'form') {
    return (
      <div className="max-w-2xl mx-auto animate-fadeInUp">
        <button onClick={() => navigate(`/b/${slug}`)} className="text-slate-400 hover:text-white text-sm mb-3">← Voltar</button>
        <h1 className="text-3xl font-black mb-1">Participar do bolão</h1>
        <p className="text-slate-400 text-sm mb-5">{pool.name}</p>

        {/* Banner de indicação */}
        {referrerShare && (
          <Card className="p-4 mb-5 bg-yellow-500/[0.08] border-yellow-500/25">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔗</span>
              <div>
                <div className="font-bold text-yellow-300 text-sm">
                  Você foi indicado por <strong>{referrerShare.participant_name}</strong>!
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Se você chegar ao pódio, {referrerShare.participant_name} recebe {pool.referral_bonus_percent || 5}% do seu prêmio.
                </div>
              </div>
            </div>
          </Card>
        )}

        <Stepper current={1} />

        <form onSubmit={user ? handleProceed : (e => e.preventDefault())} className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Autenticação */}
            {user ? (
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center text-xl font-black text-slate-950">
                    {(name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold">{name}</div>
                    <div className="text-xs text-slate-500">{email}</div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">{authMode === 'signup' ? '🆕 Crie sua conta' : '🔓 Entrar'}</h2>
                  <button type="button" onClick={() => setAuthMode(m => m === 'signup' ? 'login' : 'signup')}
                    className="text-xs text-emerald-300 hover:underline">
                    {authMode === 'signup' ? 'Já tenho conta' : 'Criar nova conta'}
                  </button>
                </div>

                {authMode === 'signup' ? (
                  <form onSubmit={handleSignup} className="space-y-3">
                    <Input label="Nome completo" value={name} onChange={setName} required placeholder="João da Silva" />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input label="E-mail" type="email" value={email} onChange={setEmail} required placeholder="voce@email.com" />
                      <Input label="WhatsApp" value={phone} onChange={setPhone} required placeholder="(11) 99999-9999" />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <Input label="Usuário" value={username} onChange={setUsername} required placeholder="seu_user" />
                      <Input label="Senha" type="password" value={password} onChange={setPassword} required placeholder="••••••" />
                      <Input label="Confirmar" type="password" value={confirm} onChange={setConfirm} required placeholder="••••••" />
                    </div>
                    <Input label="Chave PIX (para receber bônus)" value={pixBonus} onChange={setPixBonus}
                      placeholder="CPF, e-mail, telefone ou chave aleatória" hint="Opcional — apenas se indicar alguém." />
                    <Button type="submit" size="lg" full>🚀 Criar conta e continuar</Button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-3">
                    <Input label="Usuário ou e-mail" value={loginId} onChange={setLoginId} placeholder="seu_user" />
                    <Input label="Senha" type="password" value={loginPw} onChange={setLoginPw} placeholder="••••••" />
                    <Button type="submit" size="lg" full>🔓 Entrar</Button>
                  </form>
                )}
              </Card>
            )}

            {/* Quantidade de cotas */}
            {user && (
              <>
                <Card className="p-6 space-y-3">
                  <h2 className="font-bold">🎟️ Quantas cotas?</h2>
                  <p className="text-xs text-slate-400">
                    Cada cota = 1 bilhete com palpites independentes. Mais cotas = mais chances.
                  </p>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-2xl font-bold hover:bg-white/10">−</button>
                    <input type="number" value={quantity}
                      onChange={e => setQuantity(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                      className="w-20 text-center text-2xl font-black bg-slate-900/60 border border-white/10 rounded-xl py-2" />
                    <button type="button" onClick={() => setQuantity(q => Math.min(10, q + 1))}
                      className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-2xl font-bold hover:bg-white/10">+</button>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5].map(n => (
                      <button key={n} type="button" onClick={() => setQuantity(n)}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                          quantity === n
                            ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                        }`}>
                        {n} cota{n > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Termos */}
                <Card className="p-5">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded accent-emerald-500" />
                    <span className="text-sm text-slate-400">
                      Li e aceito os{' '}
                      <button type="button" onClick={() => navigate('/terms')} className="text-emerald-300 underline">Termos de Uso</button>,{' '}
                      <button type="button" onClick={() => navigate('/privacy')} className="text-emerald-300 underline">Privacidade</button>{' '}
                      e <button type="button" onClick={() => navigate('/legal')} className="text-emerald-300 underline">Aviso Legal</button>.
                    </span>
                  </label>
                </Card>
              </>
            )}
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="p-6 bg-gradient-to-br from-emerald-500/[0.08] to-yellow-500/[0.04] border-emerald-500/20">
                <h3 className="font-bold mb-4">📊 Resumo</h3>
                <div className="space-y-2 text-sm">
                  <SRow label="Bolão" value={pool.name} />
                  <SRow label={`${quantity} cota(s) × ${formatBRL(pool.share_value)}`} value={formatBRL(total)} />
                  <SRow label="Pagamento" value="PIX (PushinPay)" green />
                  <div className="h-px bg-white/10 my-2" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400">Total</span>
                    <strong className="text-2xl font-black text-emerald-300">{formatBRL(total)}</strong>
                  </div>
                </div>
                {user && (
                  <Button type="button" size="lg" full className="mt-6" onClick={() => handleProceed(new Event('click') as any)}>
                    ⚡ Gerar PIX e pagar
                  </Button>
                )}
                {!user && (
                  <p className="text-xs text-slate-500 mt-4 text-center">
                    Crie uma conta ou faça login para continuar.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </form>
      </div>
    );
  }

  /* ═══ STEP: PAYMENT ═══ */
  if (step === 'payment') {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');

    return (
      <div className="max-w-2xl mx-auto animate-fadeInUp">
        <Stepper current={2} />
        <Card className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">⚡</div>
            <h1 className="text-2xl font-black">Pagamento via PIX</h1>
            <p className="text-slate-400 text-sm mt-1">
              {quantity} cota(s) — <strong className="text-emerald-300">{formatBRL(total)}</strong>
            </p>
          </div>

          {referrerShare && (
            <div className="bg-yellow-500/[0.08] border border-yellow-500/20 rounded-xl p-3 mb-4 text-sm text-yellow-200">
              🔗 Indicado por <strong>{referrerShare.participant_name}</strong>.
              Se você vencer, ele recebe {pool.referral_bonus_percent || 5}% do seu prêmio.
            </div>
          )}

          {/* QR Code REAL da PushinPay */}
          {qrCodeBase64 && (
            <div className="bg-white p-4 rounded-2xl mx-auto w-fit mb-4 shadow-xl">
              <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code PIX"
                width={200}
                height={200}
                className="block"
              />
            </div>
          )}
          <p className="text-center text-sm text-slate-400 mb-4">Escaneie com o app do seu banco</p>

          {/* Código copia-e-cola REAL */}
          {pixCode && (
            <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3 mb-4">
              <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Código PIX (copia e cola)</div>
              <div className="font-mono text-[11px] text-slate-300 break-all mb-2">{pixCode}</div>
              <Button size="sm" variant="secondary" full onClick={() => {
                navigator.clipboard.writeText(pixCode);
                toast.success('Código copiado!');
              }}>
                📋 Copiar código
              </Button>
            </div>
          )}

          <div className="flex justify-between text-sm mb-4">
            <span className="text-slate-400">⏱️ Expira em:</span>
            <span className="font-mono font-bold text-yellow-300 text-lg">{mm}:{ss}</span>
          </div>

          <Card className="p-4 bg-blue-500/[0.08] border-blue-500/20 mb-4 text-sm text-blue-200">
            🔒 <strong>Pagamento seguro via PushinPay.</strong> O sistema verifica automaticamente
            quando você paga. Não é necessário enviar comprovante.
          </Card>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-sm text-slate-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Aguardando confirmação automática...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  /* ═══ STEP: SUCCESS ═══ */
  return (
    <div className="max-w-2xl mx-auto text-center animate-fadeInUp">
      <Confetti active />
      <Stepper current={3} />
      <Card className="p-8 sm:p-12 bg-gradient-to-br from-emerald-500/[0.12] to-transparent border-emerald-500/30">
        <div className="text-7xl mb-4 animate-float">🎉</div>
        <h1 className="text-3xl font-black mb-2">Pagamento confirmado!</h1>
        <p className="text-slate-300 mb-6">
          <strong>{quantity} cota(s)</strong> ativadas — {formatBRL(total)}
        </p>

        <div className="bg-blue-500/[0.08] border border-blue-500/20 rounded-xl p-4 mb-6 text-sm text-blue-200">
          🔐 Seus dados estão seguros. Acesse pelo menu <strong>Meu Perfil</strong> a qualquer momento.
        </div>

        <h2 className="text-xl font-bold mb-3">⚽ Faça seus palpites!</h2>
        <p className="text-sm text-slate-400 mb-6">
          Preencha os placares dos 48 jogos da Copa. Você pode editar até a data limite.
        </p>
        <Button size="lg" onClick={() => navigate(`/b/${slug}/predict/${shareId}`)}>
          🎯 Fazer palpites agora
        </Button>
        <button onClick={() => navigate(`/b/${slug}`)}
          className="block mt-4 text-sm text-slate-400 hover:text-white mx-auto">
          Voltar ao bolão
        </button>
      </Card>
    </div>
  );
}

/* ── Helpers ── */
function SRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={green ? 'text-emerald-400 font-semibold' : 'font-semibold text-slate-200'}>{value}</span>
    </div>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Conta & cotas', 'Pagamento PIX', 'Palpites'];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((s, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < current;
        const active = n === current;
        return (
          <div key={s} className="flex items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              done ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
              : active ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-200'
              : 'bg-slate-800 text-slate-500'
            }`}>{done ? '✓' : n}</div>
            <span className={`mx-2 text-xs ${active ? 'text-emerald-300 font-bold' : 'text-slate-500'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`w-8 h-px ${done ? 'bg-emerald-500' : 'bg-slate-700'}`} />}
          </div>
        );
      })}
    </div>
  );
}
