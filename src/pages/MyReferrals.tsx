import { useState } from 'react';
import { Badge, Button, Card, Stat } from '../components/Layout';
import { navigate } from '../lib/router';
import {
  getBolaoById, getCotaById, getCotasByBolao,
  getReferralsByBolao, getReferralLink, getTransactions,
  rankBolao,
} from '../lib/storage';
import { brl } from '../lib/scoring';
import { toast } from '../lib/toast';
import type { ReferralBonus } from '../types';

export function MyReferrals({ slug, cotaId }: { slug: string; cotaId: string }) {
  const cota = getCotaById(cotaId);
  const bolao = cota ? getBolaoById(cota.bolaoId) : undefined;

  if (!cota || !bolao) {
    return (
      <Card className="p-12 text-center max-w-lg mx-auto">
        <div className="text-5xl mb-3">🤔</div>
        <h2 className="text-xl font-bold">Não encontrado</h2>
        <p className="text-slate-400 mt-2">Verifique o link ou acesse via "Minha Área".</p>
        <Button className="mt-4" onClick={() => navigate('/')}>Home</Button>
      </Card>
    );
  }

  const referralLink = getReferralLink(slug, cota.referralCode);
  const allReferrals = getReferralsByBolao(bolao.id)
    .filter(r => r.referrerCotaId === cotaId);

  // Ranking atual — para saber a posição dos indicados
  const allCotas    = getCotasByBolao(bolao.id);
  const ranking     = rankBolao(bolao);

  const prizePool   = allCotas.filter(c=>c.paymentStatus==='paid')
    .reduce((s,c)=>s+c.totalAmount,0) * (1 - bolao.commissionPercent/100);

  // Calcula bônus potencial por indicado
  const prizeByPlace = {
    1: prizePool * bolao.prizeDistribution.first / 100,
    2: prizePool * bolao.prizeDistribution.second / 100,
    3: prizePool * bolao.prizeDistribution.third / 100,
  };

  // Bônus de indicação já registrado em transações
  const bonusTransactions = getTransactions()
    .filter(t => t.cotaId === cotaId && t.type === 'referral_bonus');
  const totalBonusEarned = bonusTransactions.reduce((s,t) => s+t.amount, 0);

  // Calcula bônus potencial se indicados ficarem no pódio
  let potentialBonus = 0;
  allReferrals.forEach(r => {
    const idx = ranking.findIndex(e => e.cotaId === r.referredCotaId);
    if (idx === 0) potentialBonus += prizeByPlace[1] * bolao.referralBonusPercent / 100;
    else if (idx === 1) potentialBonus += prizeByPlace[2] * bolao.referralBonusPercent / 100;
    else if (idx === 2) potentialBonus += prizeByPlace[3] * bolao.referralBonusPercent / 100;
  });

  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copiado!', 'Compartilhe no WhatsApp e traga mais amigos.');
    setTimeout(() => setCopied(false), 2500);
  }

  const waMsg =
    `🏆 *${bolao.name}*\n\n` +
    `⚽ Bolão da Copa do Mundo 2026 — entre por aqui!\n` +
    `💰 Cota: ${brl(bolao.shareValue)}\n` +
    `🏆 Prêmio: ${brl(prizePool)}\n\n` +
    `Se você ganhar algum prêmio, eu recebo ${bolao.referralBonusPercent}% do seu valor como bônus 😄 Bora?\n\n` +
    `👉 ${referralLink}`;

  return (
    <div className="max-w-3xl mx-auto animate-fadeInUp">
      <button onClick={() => navigate(`/b/${slug}`)} className="text-slate-400 hover:text-white text-sm mb-3">
        ← Voltar ao bolão
      </button>

      <div className="mb-6">
        <Badge color="yellow">🔗 Sistema de Indicações</Badge>
        <h1 className="text-3xl font-black mt-2">Minhas Indicações</h1>
        <p className="text-slate-400 text-sm mt-1">
          {bolao.name} · <strong className="text-white">{cota.participantName}</strong>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Stat icon="👥" label="Pessoas indicadas"
          value={String(allReferrals.length)} accent="blue" />
        <Stat icon="💰" label="Bônus potencial"
          value={brl(potentialBonus)} accent="yellow"
          sub="se indicados vencerem" />
        <Stat icon="✅" label="Bônus já confirmado"
          value={brl(totalBonusEarned)} accent="emerald" />
      </div>

      {/* Como funciona — explicação detalhada */}
      <Card className="p-6 bg-gradient-to-br from-yellow-500/[0.08] to-amber-500/[0.04] border-yellow-500/20 mb-6">
        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
          <span>🔗</span> Como funciona o bônus de indicação
        </h2>

        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <HowStep n="1" emoji="🔗" title="Compartilhe seu link" desc="Mande seu link único para amigos. Cada pessoa que entrar pelo seu link fica vinculada a você." />
          <HowStep n="2" emoji="🎯" title="Eles entram no bolão" desc="Seus amigos se inscrevem, pagam a cota e fazem os palpites normalmente." />
          <HowStep n="3" emoji="💰" title="Você ganha bônus" desc={`Se um indicado seu ficar no pódio (1°, 2° ou 3°), você recebe ${bolao.referralBonusPercent}% do prêmio dele via PIX.`} />
        </div>

        {/* Tabela de bônus por colocação */}
        <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-4 mb-4">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">
            Seu bônus por colocação do indicado (bolão atual)
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <BonusPlace medal="🥇" place="1º lugar"
              prize={prizeByPlace[1]} bonus={prizeByPlace[1] * bolao.referralBonusPercent/100}
              pct={bolao.referralBonusPercent} />
            <BonusPlace medal="🥈" place="2º lugar"
              prize={prizeByPlace[2]} bonus={prizeByPlace[2] * bolao.referralBonusPercent/100}
              pct={bolao.referralBonusPercent} />
            <BonusPlace medal="🥉" place="3º lugar"
              prize={prizeByPlace[3]} bonus={prizeByPlace[3] * bolao.referralBonusPercent/100}
              pct={bolao.referralBonusPercent} />
          </div>
        </div>

        <div className="bg-slate-950/40 rounded-xl p-3 text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">⚠️ Regras importantes:</strong><br />
          • O bônus é calculado sobre o <strong className="text-white">prêmio final</strong> recebido pelo indicado,
          após o encerramento da Copa e divulgação oficial do ranking.<br />
          • O prêmio do indicado <strong className="text-white">NÃO é reduzido</strong> — o bônus sai da comissão do organizador.<br />
          • O pagamento é feito via PIX para a chave cadastrada em até 5 dias úteis após a final.<br />
          • Válido apenas para indicados que tenham <strong className="text-white">pago a cota</strong> pelo seu link.
        </div>
      </Card>

      {/* Link de indicação */}
      <Card className="p-6 mb-6">
        <h2 className="font-bold mb-3 flex items-center gap-2">📲 Seu link único de indicação</h2>
        <div className="bg-slate-950/60 border border-white/[0.06] rounded-xl p-3 mb-3">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Link</div>
          <div className="font-mono text-xs text-emerald-300 break-all">{referralLink}</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <button onClick={copy}
            className={`py-3 rounded-xl text-sm font-bold transition border ${
              copied ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}>
            {copied ? '✓ Copiado!' : '📋 Copiar link'}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(waMsg)}`}
            target="_blank" rel="noopener noreferrer"
            className="py-3 rounded-xl text-sm font-bold text-center bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/25 transition">
            💬 Compartilhar no WhatsApp
          </a>
        </div>
      </Card>

      {/* Lista de indicados */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h2 className="font-bold">👥 Pessoas que você indicou ({allReferrals.length})</h2>
        </div>
        {allReferrals.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-3 animate-float">👤</div>
            <p className="text-slate-400 text-sm">Você ainda não indicou ninguém.</p>
            <p className="text-slate-500 text-xs mt-1">Compartilhe seu link e comece a ganhar bônus!</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {allReferrals.map(r => (
              <ReferredRow key={r.id} referral={r} ranking={ranking}
                prizeByPlace={prizeByPlace} bolao={bolao} />
            ))}
          </div>
        )}
      </Card>

      {/* PIX para bônus */}
      {cota.pixKeyForBonus && (
        <Card className="p-4 mt-4 bg-emerald-500/[0.06] border-emerald-500/20 text-sm">
          <div className="text-emerald-300 font-bold mb-1">✅ Chave PIX cadastrada para bônus</div>
          <div className="text-slate-400 font-mono text-xs">{cota.pixKeyForBonus}</div>
        </Card>
      )}
      {!cota.pixKeyForBonus && (
        <Card className="p-4 mt-4 bg-yellow-500/[0.06] border-yellow-500/20 text-sm">
          <div className="text-yellow-300 font-bold mb-1">⚠️ Chave PIX não cadastrada</div>
          <div className="text-slate-400 text-xs">
            Você não cadastrou uma chave PIX ao se inscrever.
            Entre em contato com o organizador para informar sua chave antes do fim da Copa.
          </div>
        </Card>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate(`/b/${slug}`)}>← Bolão</Button>
        <Button variant="secondary" onClick={() => navigate(`/b/${slug}/ranking`)}>🏆 Ranking</Button>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function HowStep({ n, emoji, title, desc }: { n: string; emoji: string; title: string; desc: string }) {
  return (
    <div className="bg-slate-900/40 rounded-xl p-4 text-center border border-white/[0.06]">
      <div className="w-7 h-7 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-xs font-black flex items-center justify-center mx-auto mb-2">{n}</div>
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="font-bold text-sm mb-1">{title}</div>
      <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
    </div>
  );
}

function BonusPlace({ medal, place, prize, bonus, pct }: {
  medal: string; place: string; prize: number; bonus: number; pct: number;
}) {
  return (
    <div className="bg-slate-900/60 rounded-xl p-3">
      <div className="text-2xl">{medal}</div>
      <div className="text-[10px] text-slate-500 mt-1">{place}</div>
      <div className="text-xs text-slate-400 mt-1">Prêmio: {brl(prize)}</div>
      <div className="text-sm font-black text-yellow-300 mt-1">{brl(bonus)}</div>
      <div className="text-[10px] text-slate-500">seu bônus ({pct}%)</div>
    </div>
  );
}

function ReferredRow({ referral, ranking, prizeByPlace, bolao }: {
  referral: ReferralBonus;
  ranking: ReturnType<typeof rankBolao>;
  prizeByPlace: Record<1|2|3, number>;
  bolao: ReturnType<typeof getBolaoById>;
}) {
  if (!bolao) return null;
  const rankIdx = ranking.findIndex(r => r.cotaId === referral.referredCotaId);
  const rankPos = rankIdx >= 0 ? rankIdx + 1 : null;
  const inPodio = rankPos && rankPos <= 3;
  const myBonus = inPodio
    ? prizeByPlace[rankPos as 1|2|3] * bolao.referralBonusPercent / 100
    : 0;

  return (
    <div className="p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="font-medium">{referral.referredName}</div>
        <div className="text-xs text-slate-500">{referral.referredEmail} · indicado em {new Date(referral.createdAt).toLocaleDateString('pt-BR')}</div>
      </div>
      <div className="flex items-center gap-3">
        {rankPos ? (
          <div className="text-center">
            <div className="text-lg">{rankPos===1?'🥇':rankPos===2?'🥈':rankPos===3?'🥉':`#${rankPos}`}</div>
            <div className="text-[10px] text-slate-500">posição</div>
          </div>
        ) : (
          <div className="text-xs text-slate-600">sem pontos</div>
        )}
        {inPodio && (
          <div className="text-right">
            <div className="font-black text-yellow-300">{brl(myBonus)}</div>
            <div className="text-[10px] text-slate-500">bônus potencial</div>
          </div>
        )}
        {referral.bonusPaid && (
          <Badge color="emerald">Pago ✓</Badge>
        )}
      </div>
    </div>
  );
}
