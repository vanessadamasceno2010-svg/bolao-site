import { useMemo, useState } from 'react';
import { Badge, Button, Card, EmptyState, Input, Stat } from '../components/Layout';
import { navigate } from '../lib/router';
import {
  authenticate, getBolaoById, getCotas, getCotasByUser,
  getLoggedUser, getMatches, getPredictionsByTicket,
  getReferralLink, getReferralsByReferrer, getTicketsByCota,
  participantRequestPasswordReset,
  rankBolao, setParticipantSession, updateUser,
} from '../lib/storage';
import { brl } from '../lib/scoring';
import { toast } from '../lib/toast';
import type { Cota, User } from '../types';

type LoginView = 'login' | 'forgot' | 'reset';

export function Perfil() {
  const [, setTick] = useState(0);
  const user = getLoggedUser();

  if (!user) return <LoginScreen onLogin={() => setTick(t => t + 1)} />;
  return <Dashboard user={user} onChange={() => setTick(t => t + 1)} />;
}

/* ─────────── Login com recuperação de senha ─────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [view, setView] = useState<LoginView>('login');
  const [id, setId]       = useState('');
  const [pw, setPw]       = useState('');

  // Forgot password
  const [fpId, setFpId]         = useState('');
  const [fpResult, setFpResult] = useState<ReturnType<typeof participantRequestPasswordReset> | null>(null);
  const [fpNewPw, setFpNewPw]   = useState('');
  const [fpNewPw2, setFpNewPw2] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = authenticate(id, pw);
    if (!u) { toast.error('Login inválido', 'Usuário/e-mail ou senha incorretos.'); return; }
    setParticipantSession({ userId: u.id });
    toast.success(`Bem-vindo, ${u.name.split(' ')[0]}!`);
    onLogin();
  }

  function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!fpId.trim()) { toast.warning('Informe seu e-mail ou usuário.'); return; }
    const result = participantRequestPasswordReset(fpId);
    setFpResult(result);
    if (result.ok) setView('reset');
    else toast.error('Não encontrado', result.message);
  }

  function handleResetPw(e: React.FormEvent) {
    e.preventDefault();
    if (fpNewPw.length < 4) { toast.warning('Senha', 'Mínimo 4 caracteres.'); return; }
    if (fpNewPw !== fpNewPw2) { toast.warning('As senhas não conferem.'); return; }
    if (fpResult?.username) {
      // Encontra o usuário pelo username retornado para pegar o ID
      import('../lib/storage').then(mod => {
        const user = mod.getUserByUsername(fpResult.username!);
        if (user) mod.participantResetPassword(user.id, fpNewPw);
        toast.success('Senha redefinida!', 'Faça login com sua nova senha.');
        setView('login'); setFpId(''); setFpNewPw(''); setFpNewPw2(''); setFpResult(null);
      });
    }
  }

  /* ═══ VIEW: FORGOT PASSWORD ═══ */
  if (view === 'forgot') {
    return (
      <div className="max-w-md mx-auto animate-fadeInUp">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-black">Recuperar senha</h1>
          <p className="text-slate-400 text-sm mt-2">Informe o e-mail ou usuário da sua conta.</p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleRequestReset} className="space-y-4">
            <Input label="E-mail ou usuário" value={fpId} onChange={setFpId}
              required placeholder="seu_user ou voce@email.com" />
            <Button type="submit" size="lg" full>📨 Enviar nova senha</Button>
          </form>
          <button onClick={() => setView('login')}
            className="mt-4 text-sm text-emerald-400 hover:underline block text-center w-full">
            ← Voltar ao login
          </button>
        </Card>
      </div>
    );
  }

  /* ═══ VIEW: RESET PASSWORD ═══ */
  if (view === 'reset' && fpResult) {
    return (
      <div className="max-w-md mx-auto animate-fadeInUp">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📬</div>
          <h1 className="text-2xl font-black">Redefinir senha</h1>
          <p className="text-slate-400 text-sm mt-2">{fpResult.message}</p>
          {fpResult.tempPassword && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mt-4 text-sm text-yellow-200">
              📧 Sua nova senha temporária: <strong className="text-white font-mono">{fpResult.tempPassword}</strong>
              <div className="text-xs text-yellow-200/60 mt-1">
                (Na demo é exibida aqui. Em produção, chega por e-mail.)
              </div>
            </div>
          )}
        </div>
        <Card className="p-6">
          <form onSubmit={handleResetPw} className="space-y-4">
            <Input label="Nova senha" type="password" value={fpNewPw}
              onChange={setFpNewPw} required placeholder="••••••" />
            <Input label="Confirmar nova senha" type="password" value={fpNewPw2}
              onChange={setFpNewPw2} required placeholder="••••••" />
            <Button type="submit" size="lg" full>💾 Salvar nova senha</Button>
          </form>
          <button onClick={() => { setView('login'); setFpResult(null); }}
            className="mt-4 text-sm text-emerald-400 hover:underline block text-center w-full">
            Ir para o login
          </button>
        </Card>
      </div>
    );
  }

  /* ═══ VIEW: LOGIN (default) ═══ */
  return (
    <div className="max-w-md mx-auto animate-fadeInUp">
      <div className="text-center mb-8">
        <div className="text-6xl mb-3 animate-float">👤</div>
        <h1 className="text-3xl font-black">Meu Perfil</h1>
        <p className="text-slate-400 mt-2 text-sm">Entre com seu usuário e senha.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-4">
          <Input label="Usuário ou e-mail" value={id} onChange={setId} placeholder="seu_user ou voce@email.com" />
          <Input label="Senha" type="password" value={pw} onChange={setPw} placeholder="••••••" />
          <Button type="submit" size="lg" full>🔓 Entrar</Button>
        </form>
        <div className="mt-3 text-center">
          <button onClick={() => setView('forgot')}
            className="text-sm text-slate-400 hover:text-white hover:underline">
            Esqueci minha senha
          </button>
        </div>
        <div className="mt-3 text-center text-xs text-slate-500">
          Não tem conta? Ela é criada ao participar de um bolão.
        </div>
      </Card>

      <p className="text-center text-xs text-slate-500 mt-4">
        Não tem conta? Ela é criada ao{' '}
        <button onClick={() => navigate('/')} className="text-emerald-300 underline">participar de um bolão</button>.
      </p>
    </div>
  );
}

/* ─────────── Dashboard ─────────── */
function Dashboard({ user, onChange }: { user: User; onChange: () => void }) {
  const [tab, setTab] = useState<'boloes'|'indicacoes'|'dados'>('boloes');
  const cotas = getCotasByUser(user.id);
  const paidCotas = cotas.filter(c => c.paymentStatus === 'paid');
  const totalInvestido = paidCotas.reduce((s, c) => s + c.totalAmount, 0);
  const totalBilhetes = paidCotas.reduce((s, c) => s + c.quantity, 0);
  const allReferrals = cotas.flatMap(c => getReferralsByReferrer(c.id));

  function logout() { setParticipantSession(null); onChange(); }

  return (
    <div className="max-w-4xl mx-auto animate-fadeInUp">
      <Card className="p-6 mb-6 bg-gradient-to-br from-emerald-500/[0.08] to-yellow-500/[0.04] border-emerald-500/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-yellow-400 flex items-center justify-center text-3xl font-black text-slate-950">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black">{user.name}</h1>
              <div className="text-sm text-slate-400">@{user.username} · {user.email}</div>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>Sair</Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon="🎯" label="Bolões"     value={String(paidCotas.length)} accent="blue" />
        <Stat icon="🎟️" label="Bilhetes"   value={String(totalBilhetes)} accent="purple" />
        <Stat icon="💰" label="Investido"  value={brl(totalInvestido)} accent="yellow" />
        <Stat icon="🔗" label="Indicações" value={String(allReferrals.length)} accent="emerald" />
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-white/[0.06] overflow-x-auto">
        {([
          { k:'boloes' as const,     icon:'🎯', label:`Meus Bolões (${paidCotas.length})` },
          { k:'indicacoes' as const, icon:'🔗', label:`Indicações (${allReferrals.length})` },
          { k:'dados' as const,      icon:'⚙️', label:'Meus Dados' },
        ]).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 ${
              tab === t.k ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'boloes'     && <BoloesTab cotas={cotas} />}
      {tab === 'indicacoes' && <IndicacoesTab cotas={cotas} />}
      {tab === 'dados'      && <DadosTab user={user} onSaved={onChange} />}
    </div>
  );
}

/* ─────────── Bolões ─────────── */
function BoloesTab({ cotas }: { cotas: Cota[] }) {
  if (cotas.length === 0) {
    return <EmptyState icon="🎯" title="Nenhum bolão ainda"
      desc="Participe de um bolão para acompanhar seus palpites aqui."
      action={() => navigate('/')} actionLabel="Ver bolões" />;
  }
  return (
    <div className="space-y-4 animate-fadeIn">
      {cotas.map(c => <BolaoCard key={c.id} cota={c} />)}
    </div>
  );
}

function BolaoCard({ cota }: { cota: Cota }) {
  const bolao = getBolaoById(cota.bolaoId);
  if (!bolao) return null;

  const matches = getMatches();
  const ranking = rankBolao(bolao);
  const tickets = getTicketsByCota(cota.id);

  // melhor posição entre os bilhetes desta cota
  let bestPos: number | null = null;
  let bestPts = 0;
  ranking.forEach((e, i) => {
    if (e.cotaId === cota.id) {
      if (bestPos === null || i + 1 < bestPos) bestPos = i + 1;
      bestPts = Math.max(bestPts, e.totalPoints);
    }
  });

  return (
    <Card className="p-5" hover>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-lg">{bolao.name}</h3>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            Organizado por {bolao.organizerName}
            {cota.paymentStatus === 'paid' ? <Badge color="emerald">Pago ✓</Badge> : <Badge color="yellow">Pendente</Badge>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-black text-emerald-300">{bestPts} pts</div>
          <div className="text-xs text-slate-500">{bestPos ? `melhor: #${bestPos}` : '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-xs mb-4">
        <div className="bg-white/5 rounded-lg py-2">
          <div className="text-slate-500">Cotas/Bilhetes</div>
          <div className="font-bold">{cota.quantity}</div>
        </div>
        <div className="bg-white/5 rounded-lg py-2">
          <div className="text-slate-500">Investido</div>
          <div className="font-bold">{brl(cota.totalAmount)}</div>
        </div>
        <div className="bg-white/5 rounded-lg py-2">
          <div className="text-slate-500">Jogos</div>
          <div className="font-bold">{matches.length}</div>
        </div>
      </div>

      {/* Status de preenchimento por bilhete */}
      {cota.paymentStatus === 'paid' && tickets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tickets.map(t => {
            const filled = getPredictionsByTicket(t.id).length;
            const complete = filled >= matches.length;
            return (
              <span key={t.id}
                className={`text-[10px] px-2 py-1 rounded-lg border ${
                  complete ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300'}`}>
                Bilhete {t.index}: {filled}/{matches.length}{complete ? ' ✓' : ''}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {cota.paymentStatus === 'paid' ? (
          <Button size="sm" className="flex-1" onClick={() => navigate(`/b/${bolao.slug}/predict/${cota.id}`)}>
            🎯 Preencher palpites
          </Button>
        ) : (
          <Button size="sm" className="flex-1" onClick={() => navigate(`/b/${bolao.slug}/join`)}>
            💳 Concluir pagamento
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={() => navigate(`/b/${bolao.slug}/ranking`)}>🏆 Ranking</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate(`/b/${bolao.slug}/indicacao/${cota.id}`)}>🔗 Indicar</Button>
      </div>
    </Card>
  );
}

/* ─────────── Indicações ─────────── */
function IndicacoesTab({ cotas }: { cotas: Cota[] }) {
  const data = useMemo(() => {
    return cotas.map(cota => {
      const bolao = getBolaoById(cota.bolaoId);
      if (!bolao) return null;
      const referrals = getReferralsByReferrer(cota.id);
      const link = getReferralLink(bolao.slug, cota.referralCode);
      const ranking = rankBolao(bolao);
      const arrecadado = getCotas().filter(c => c.bolaoId === bolao.id && c.paymentStatus === 'paid')
        .reduce((s, c) => s + c.totalAmount, 0);
      const prizePool = arrecadado * (1 - bolao.commissionPercent/100);
      const prizeByPlace: Record<number,number> = {
        1: prizePool * bolao.prizeDistribution.first/100,
        2: prizePool * bolao.prizeDistribution.second/100,
        3: prizePool * bolao.prizeDistribution.third/100,
      };
      let potential = 0;
      const enriched = referrals.map(r => {
        // melhor posição entre bilhetes do indicado
        let pos: number | null = null;
        ranking.forEach((e, i) => { if (e.cotaId === r.referredCotaId && (pos === null || i+1 < pos)) pos = i+1; });
        const bonus = pos && pos <= 3 ? prizeByPlace[pos] * bolao.referralBonusPercent/100 : 0;
        potential += bonus;
        return { r, pos, bonus };
      });
      return { cota, bolao, link, enriched, potential };
    }).filter(Boolean);
  }, [cotas]);

  if (data.length === 0) {
    return <EmptyState icon="🔗" title="Nenhuma indicação" desc="Participe de um bolão para receber seu link de indicação." />;
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <Card className="p-4 bg-yellow-500/[0.06] border-yellow-500/15 text-sm text-yellow-200">
        🔗 <strong>Como funciona:</strong> compartilhe seu link de cada bolão. Se quem você indicou
        chegar ao 1º, 2º ou 3º lugar, você ganha uma % do prêmio dele via PIX.
      </Card>

      {data.map(d => {
        const { cota, bolao, link, enriched, potential } = d!;
        return (
          <Card key={cota.id} className="p-5">
            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
              <div>
                <h3 className="font-bold">{bolao.name}</h3>
                <div className="text-xs text-slate-500">{enriched.length} pessoa(s) indicada(s)</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Bônus potencial</div>
                <div className={`font-black ${potential>0?'text-yellow-300':'text-slate-500'}`}>{brl(potential)}</div>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-3 mb-3">
              <div className="font-mono text-[11px] text-emerald-300 break-all mb-2">{link}</div>
              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copiado!'); }}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition">
                  📋 Copiar
                </button>
                <a href={`https://wa.me/?text=${encodeURIComponent(`🏆 Entra no ${bolao.name}! ${link}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-center bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/25 transition">
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {enriched.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-3">Você ainda não indicou ninguém neste bolão.</div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {enriched.map(({ r, pos, bonus }) => (
                  <div key={r.id} className="flex justify-between items-center py-2.5 text-sm">
                    <span className="font-medium">{r.referredName}</span>
                    <div className="flex items-center gap-3">
                      {pos ? <span>{pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':`#${pos}`}</span>
                           : <span className="text-slate-600 text-xs">sem posição</span>}
                      {bonus > 0 && <span className="font-bold text-yellow-300">{brl(bonus)}</span>}
                      {r.bonusPaid && <Badge color="emerald">Pago ✓</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => navigate(`/b/${bolao.slug}/indicacao/${cota.id}`)}
              className="text-xs text-yellow-300 hover:underline mt-3 block text-center w-full">
              Ver painel completo de indicações →
            </button>
          </Card>
        );
      })}
    </div>
  );
}

/* ─────────── Dados ─────────── */
function DadosTab({ user, onSaved }: { user: User; onSaved: () => void }) {
  const [name, setName]   = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [pix, setPix]     = useState(user.pixKeyForBonus ?? '');
  const [pw, setPw]       = useState('');
  const [pw2, setPw2]     = useState('');
  const [saving, setSaving] = useState(false);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.warning('Nome obrigatório'); return; }
    if (!email.trim()) { toast.warning('E-mail obrigatório'); return; }
    if (pw && pw.length < 4) { toast.warning('Senha', 'A nova senha precisa ter 4+ caracteres.'); return; }
    if (pw && pw !== pw2) { toast.warning('Senha', 'As senhas não conferem.'); return; }
    setSaving(true);
    setTimeout(() => {
      updateUser(user.id, {
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        pixKeyForBonus: pix.trim() || undefined,
        password: pw || undefined,
      });
      setSaving(false);
      setPw(''); setPw2('');
      toast.success('Dados atualizados!', 'Suas informações foram salvas.');
      onSaved();
    }, 600);
  }

  const dirty = name !== user.name || email !== user.email || phone !== user.phone
    || pix !== (user.pixKeyForBonus ?? '') || pw.length > 0;

  return (
    <Card className="p-6 animate-fadeIn max-w-xl">
      <h2 className="font-bold text-lg mb-1">⚙️ Meus dados</h2>
      <p className="text-sm text-slate-400 mb-5">
        Alterar aqui atualiza seus dados em <strong className="text-slate-200">todos os bolões</strong> que você participa.
      </p>
      <form onSubmit={save} className="space-y-4">
        <Input label="Nome completo" value={name} onChange={setName} required />
        <Input label="E-mail" type="email" value={email} onChange={setEmail} required hint="Usado para login e comprovantes." />
        <Input label="WhatsApp" value={phone} onChange={setPhone} hint="Usado para notificações." />
        <Input label="Chave PIX (para bônus de indicação)" value={pix} onChange={setPix}
          placeholder="CPF, e-mail, telefone ou chave aleatória"
          hint="Necessário para receber bônus se indicar alguém que vença." />

        <div className="pt-2 border-t border-white/[0.06]">
          <div className="text-sm font-bold mb-3 text-slate-300">🔒 Alterar senha (opcional)</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Nova senha" type="password" value={pw} onChange={setPw} placeholder="••••••" />
            <Input label="Confirmar nova senha" type="password" value={pw2} onChange={setPw2} placeholder="••••••" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={!dirty || saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"/>
                Salvando...
              </span>
            ) : '💾 Salvar alterações'}
          </Button>
          {dirty && !saving && <span className="text-xs text-yellow-300">Alterações não salvas</span>}
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-white/[0.06] text-xs text-slate-500">
        🔒 Seus dados são tratados conforme a{' '}
        <button onClick={() => navigate('/privacy')} className="text-emerald-300 underline">Política de Privacidade (LGPD)</button>.
      </div>
    </Card>
  );
}
