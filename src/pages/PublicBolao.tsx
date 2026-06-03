import { useEffect, useState } from 'react';
import { Badge, Button, Card, ProgressBar, Stat } from '../components/Layout';
import { navigate } from '../lib/router';
import {
  getBolaoBySlug, getCotasByBolao,
  getReferralLink,
  rankBolao, onStorageChange,
} from '../lib/storage';
import { brl } from '../lib/scoring';
import { toast } from '../lib/toast';

export function PublicBolao({ slug }: { slug: string }) {
  const [, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick(t => t + 1)), []);

  const bolao = getBolaoBySlug(slug);
  if (!bolao) {
    return (
      <Card className="p-12 text-center max-w-lg mx-auto animate-fadeIn">
        <div className="text-5xl mb-3 animate-float">🤔</div>
        <h2 className="text-xl font-bold">Bolão não encontrado</h2>
        <p className="text-slate-400 mt-2">O link pode estar incorreto ou expirado.</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Ir para a home</Button>
      </Card>
    );
  }

  const cotas        = getCotasByBolao(bolao.id);
  const paid         = cotas.filter(c => c.paymentStatus === 'paid');
  const soldShares   = paid.reduce((s, c) => s + c.quantity, 0);
  const remaining    = bolao.totalShares - soldShares;
  const arrecadado   = paid.reduce((s, c) => s + c.totalAmount, 0);
  const premioReal   = arrecadado * (1 - bolao.commissionPercent / 100);
  const premioEst    = bolao.totalShares * bolao.shareValue * (1 - bolao.commissionPercent / 100);

  const deadline      = new Date(bolao.deadline);
  const deadlinePassed= deadline < new Date();
  const isFull        = remaining <= 0;
  const canJoin       = !deadlinePassed && !isFull && bolao.status === 'open';

  const ranking       = rankBolao(bolao);

  const prizeByPlace = {
    1: premioEst * bolao.prizeDistribution.first / 100,
    2: premioEst * bolao.prizeDistribution.second / 100,
    3: premioEst * bolao.prizeDistribution.third / 100,
  };

  return (
    <div className="max-w-4xl mx-auto animate-fadeInUp">

      {/* HERO CARD */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-emerald-500/[0.08] via-yellow-500/[0.04] to-transparent border-emerald-500/20 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <Badge color="emerald">⚽ Copa do Mundo 2026</Badge>
            <h1 className="text-2xl sm:text-4xl font-black mt-2 tracking-tight">{bolao.name}</h1>
            <div className="text-slate-400 text-sm mt-1">
              Organizado por <strong className="text-slate-200">{bolao.organizerName}</strong>
            </div>
          </div>
          {canJoin ? <Badge color="emerald">🟢 Vagas abertas</Badge>
          : isFull  ? <Badge color="blue">Lotado</Badge>
          :            <Badge color="red">Encerrado</Badge>}
        </div>

        {bolao.description && (
          <p className="text-slate-300 italic text-sm mb-4 bg-white/[0.03] rounded-xl px-4 py-3">"{bolao.description}"</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Stat icon="💰" label="Cota" value={brl(bolao.shareValue)} />
          <Stat icon="🎟️" label="Restantes" value={`${remaining}/${bolao.totalShares}`} accent="blue" />
          <Stat icon="🏆" label="Prêmio" value={brl(premioEst)} accent="yellow" sub="estimado" />
          <Stat icon="⏰" label="Prazo" value={deadline.toLocaleDateString('pt-BR')} accent="purple" />
        </div>

        <ProgressBar value={soldShares} max={bolao.totalShares} className="mb-2" />
        <div className="text-[10px] text-slate-500 text-center mb-6">
          {soldShares} de {bolao.totalShares} cotas · {Math.round(soldShares/bolao.totalShares*100)}% preenchido
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {canJoin && (
            <Button size="lg" className="flex-1" onClick={() => navigate(`/b/${slug}/join`)}>
              🎟️ Quero participar — {brl(bolao.shareValue)}/cota
            </Button>
          )}
          <Button size="lg" variant="secondary" className={canJoin ? '' : 'flex-1'}
                  onClick={() => navigate(`/b/${slug}/ranking`)}>
            🏆 Ver ranking ({ranking.length})
          </Button>
        </div>
      </Card>

      {/* INFO CARDS */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-6 animate-fadeIn stagger-1">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-slate-400">📋 Pontuação</h3>
          <ul className="space-y-2.5 text-sm">
            <ScoreRow icon="🎯" label="Placar exato"       pts={bolao.scoringRules.exactScore}     color="text-emerald-300" />
            <ScoreRow icon="🤝" label="Empate correto"     pts={bolao.scoringRules.correctDraw}     color="text-blue-300" />
            <ScoreRow icon="✅" label="Vencedor correto"   pts={bolao.scoringRules.correctWinner}   color="text-yellow-300" />
            <ScoreRow icon="➕" label="Bônus saldo de gols" pts={bolao.scoringRules.goalDifference} color="text-purple-300" />
          </ul>
        </Card>

        <Card className="p-6 animate-fadeIn stagger-2">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-slate-400">🏆 Prêmio</h3>
          <ul className="space-y-2.5 text-sm">
            {([
              { m:'🥇', p:'1º', pct: bolao.prizeDistribution.first,  c:'text-yellow-300' },
              { m:'🥈', p:'2º', pct: bolao.prizeDistribution.second, c:'text-slate-200' },
              { m:'🥉', p:'3º', pct: bolao.prizeDistribution.third,  c:'text-orange-300' },
            ]).map(x => (
              <li key={x.p} className="flex justify-between items-center">
                <span className="flex items-center gap-2">{x.m} {x.p} lugar</span>
                <strong className={x.c}>{x.pct}% — {brl(premioEst * x.pct / 100)}</strong>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-slate-600 mt-3">* Estimado com bolão lotado · Atual: {brl(premioReal)}</p>
        </Card>
      </div>

      {/* ★ BLOCO DE INDICAÇÃO — destaque */}
      <Card className="p-6 mb-6 bg-gradient-to-br from-yellow-500/[0.10] to-amber-500/[0.04] border-yellow-500/25 animate-fadeIn stagger-3">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔗</span>
          <div>
            <h3 className="font-black text-lg text-yellow-300">Ganhe bônus indicando amigos!</h3>
            <p className="text-xs text-slate-400">Cada participante recebe um link único. Quem indicar alguém que vencer, recebe prêmio extra.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <ReferralInfoCard
            emoji="🔗" step="Passo 1"
            title="Você entra no bolão"
            desc="Pague sua cota e receba automaticamente um link único de indicação."
          />
          <ReferralInfoCard
            emoji="📲" step="Passo 2"
            title="Compartilhe com amigos"
            desc="Mande seu link no WhatsApp, Instagram ou onde quiser."
          />
          <ReferralInfoCard
            emoji="💰" step="Passo 3"
            title={`Ganhe ${bolao.referralBonusPercent}% do prêmio!`}
            desc="Se seu indicado chegar ao 1°, 2° ou 3° lugar, você recebe automaticamente no PIX."
          />
        </div>

        {/* Tabela de bônus */}
        <div className="bg-slate-950/50 border border-yellow-500/15 rounded-xl p-4 mb-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">
            Quanto você pode ganhar de bônus por cada indicado que vencer
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <BonusCell medal="🥇" place="1º lugar" prize={prizeByPlace[1]}
              bonus={prizeByPlace[1] * bolao.referralBonusPercent / 100} pct={bolao.referralBonusPercent} />
            <BonusCell medal="🥈" place="2º lugar" prize={prizeByPlace[2]}
              bonus={prizeByPlace[2] * bolao.referralBonusPercent / 100} pct={bolao.referralBonusPercent} />
            <BonusCell medal="🥉" place="3º lugar" prize={prizeByPlace[3]}
              bonus={prizeByPlace[3] * bolao.referralBonusPercent / 100} pct={bolao.referralBonusPercent} />
          </div>
        </div>

        <div className="bg-slate-950/40 rounded-xl p-3 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">ℹ️ Detalhes:</strong>{' '}
          O prêmio do indicado <strong className="text-white">não é reduzido</strong> — o bônus sai da comissão do organizador.
          Pago via PIX em até 5 dias úteis após a final da Copa.
          Válido para 1°, 2° e 3° colocados. Pode indicar quantas pessoas quiser — sem limite!
        </div>

        {canJoin && (
          <Button size="lg" className="w-full mt-4" onClick={() => navigate(`/b/${slug}/join`)}>
            🎟️ Entrar e receber meu link de indicação
          </Button>
        )}

        {/* Participantes: link rápido para o painel de indicações */}
        {paid.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] text-center">
            <p className="text-xs text-slate-500 mb-2">Já é participante? Acesse seu painel de indicações:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {paid.slice(0, 3).map(c => (
                <button key={c.id} onClick={() => navigate(`/b/${slug}/indicacao/${c.id}`)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/20 transition">
                  🔗 {c.participantName.split(' ')[0]}
                </button>
              ))}
              {paid.length > 3 && (
                <span className="text-xs text-slate-500 self-center">+{paid.length - 3} outros</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* TOP 5 RANKING preview */}
      {ranking.length > 0 && (
        <Card className="p-6 animate-fadeIn stagger-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-400">🏆 Top 5</h3>
            <button onClick={() => navigate(`/b/${slug}/ranking`)} className="text-xs text-emerald-300 hover:underline">
              Ver completo →
            </button>
          </div>
          <div className="space-y-2">
            {ranking.slice(0, 5).map((r, i) => (
              <div key={r.ticketId} className="flex justify-between items-center py-2.5 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl w-7 text-center">
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`}
                  </span>
                  <div>
                    <div className="font-medium">{r.ticketLabel}</div>
                    {/* link de indicação do participante */}
                    <button
                      onClick={() => {
                        const c = paid.find(c => c.id === r.cotaId);
                        if (c) {
                          const link = getReferralLink(slug, c.referralCode);
                          navigator.clipboard.writeText(link);
                          toast.info('Link de indicação copiado!');
                        }
                      }}
                      className="text-[10px] text-yellow-400/60 hover:text-yellow-300 transition">
                      🔗 copiar link de indicação
                    </button>
                  </div>
                </div>
                <span className="font-black text-lg text-emerald-300">{r.totalPoints} pts</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Share CTA */}
      <div className="mt-6 text-center">
        <Button variant="secondary" onClick={() => {
          const msg = `🏆 ${bolao.name}\n⚽ Copa 2026 · ${brl(bolao.shareValue)}/cota\n🏆 Prêmio: ${brl(premioEst)}\n🔗 Indique amigos e ganhe bônus!\n👉 ${window.location.href}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        }}>
          📲 Compartilhar no WhatsApp
        </Button>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function ScoreRow({ icon, label, pts, color }: { icon: string; label: string; pts: number; color: string }) {
  return (
    <li className="flex justify-between items-center">
      <span className="flex items-center gap-2">{icon} {label}</span>
      <strong className={color}>{pts} pts</strong>
    </li>
  );
}

function ReferralInfoCard({ emoji, step, title, desc }: { emoji: string; step: string; title: string; desc: string }) {
  return (
    <div className="bg-slate-900/50 border border-yellow-500/10 rounded-xl p-4 text-center">
      <div className="text-[10px] uppercase tracking-widest text-yellow-400/60 mb-1">{step}</div>
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="font-bold text-sm mb-1">{title}</div>
      <div className="text-[11px] text-slate-400 leading-relaxed">{desc}</div>
    </div>
  );
}

function BonusCell({ medal, place, prize, bonus, pct }: {
  medal: string; place: string; prize: number; bonus: number; pct: number;
}) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-3">
      <div className="text-2xl">{medal}</div>
      <div className="text-[10px] text-slate-500 mt-1">{place}</div>
      <div className="text-[11px] text-slate-400">prêmio: {brl(prize)}</div>
      <div className="font-black text-yellow-300 mt-1">{brl(bonus)}</div>
      <div className="text-[10px] text-slate-500">seu bônus ({pct}%)</div>
    </div>
  );
}
