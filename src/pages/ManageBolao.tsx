import { useEffect, useState } from 'react';
import { Badge, Button, Card, EmptyState, Stat } from '../components/Layout';
import { ShareModal } from '../components/ShareModal';
import { navigate } from '../lib/router';
import {
  getBolaoById, getCotasByBolao, getMatches,
  getReferralsByBolao, rankBolao, onStorageChange,
} from '../lib/storage';
import { brl } from '../lib/scoring';
import { toast } from '../lib/toast';
import type { Bolao } from '../types';

export function ManageBolao({ id }: { id: string }) {
  const [, setTick] = useState(0);
  const [tab, setTab] = useState<'overview'|'participants'|'ranking'|'referrals'|'financial'>('overview');
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => onStorageChange(() => setTick(t => t + 1)), []);

  const bolao = getBolaoById(id);
  if (!bolao) {
    return <EmptyState icon="🤔" title="Bolão não encontrado" desc="O bolão pode ter sido removido."
      action={() => navigate('/organizador/dashboard')} actionLabel="Voltar ao Painel" />;
  }

  const cotas     = getCotasByBolao(bolao.id);
  const paidCotas = cotas.filter(c => c.paymentStatus === 'paid');
  const soldShares= paidCotas.reduce((s, c) => s + c.quantity, 0);
  const arrecadado= paidCotas.reduce((s, c) => s + c.totalAmount, 0);
  const comissao  = arrecadado * (bolao.commissionPercent / 100);
  const premio    = arrecadado - comissao;
  const link      = `${window.location.origin}${window.location.pathname}#/b/${bolao.slug}`;
  const referrals = getReferralsByBolao(bolao.id);

  const tabs = [
    { key: 'overview'     as const, icon: '📊', label: 'Visão geral' },
    { key: 'participants' as const, icon: '👥', label: `Participantes (${paidCotas.length})` },
    { key: 'ranking'      as const, icon: '🏆', label: 'Ranking' },
    { key: 'referrals'   as const, icon: '🔗', label: `Indicações (${referrals.length})` },
    { key: 'financial'   as const, icon: '💰', label: 'Financeiro' },
  ];

  return (
    <div className="animate-fadeInUp">
      <button onClick={() => navigate('/organizador/dashboard')} className="text-slate-400 hover:text-white text-sm mb-3">← Painel</button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">{bolao.name}</h1>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            #{bolao.slug}
            <Badge color="emerald">{bolao.status === 'open' ? 'Ativo' : bolao.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShareOpen(true)}>📲 Compartilhar</Button>
          <Button variant="secondary" onClick={() => navigate(`/b/${bolao.slug}`)}>🔗 Ver página</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon="🎟️" label="Cotas vendidas" value={`${soldShares}/${bolao.totalShares}`} accent="blue"
          sub={`${Math.round(soldShares/bolao.totalShares*100)}% preenchido`} />
        <Stat icon="👥" label="Participantes" value={String(paidCotas.length)} accent="purple" />
        <Stat icon="🏆" label="Prêmio total"  value={brl(premio)} accent="yellow" />
        <Stat icon="💰" label="Sua comissão"  value={brl(comissao)} accent="emerald" />
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-white/[0.06] overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition border-b-2 ${
              tab === t.key
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'     && <OverviewTab bolao={bolao} link={link} />}
      {tab === 'participants' && <ParticipantsTab bolao={bolao} />}
      {tab === 'ranking'      && <RankingTab bolao={bolao} />}
      {tab === 'referrals'    && <ReferralsTab bolao={bolao} />}
      {tab === 'financial'    && <FinancialTab bolao={bolao} />}

      <ShareModal bolao={bolao} link={link} open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}

/* ── Overview ── */
function OverviewTab({ bolao, link }: { bolao: Bolao; link: string }) {
  const totalEst  = bolao.shareValue * bolao.totalShares;
  const premioEst = totalEst * (1 - bolao.commissionPercent / 100);
  return (
    <div className="grid lg:grid-cols-2 gap-5 animate-fadeIn">
      <Card className="p-6">
        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-400">📋 Configuração</h3>
        <Detail label="Valor da cota"    value={brl(bolao.shareValue)} />
        <Detail label="Total de cotas"   value={String(bolao.totalShares)} />
        <Detail label="Data limite"      value={new Date(bolao.deadline).toLocaleDateString('pt-BR')} />
        <Detail label="Comissão"         value={`${bolao.commissionPercent}%`} />
        <Detail label="Bônus indicação"  value={`${bolao.referralBonusPercent}% do prêmio do indicado`} />
        <Detail label="Chave PIX"        value={bolao.pixKey} />
        <Detail label="Distribuição"     value={`${bolao.prizeDistribution.first}/${bolao.prizeDistribution.second}/${bolao.prizeDistribution.third}%`} />
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-400">🔗 Link</h3>
        <div className="bg-slate-950/50 border border-white/[0.06] rounded-xl p-3 text-xs text-emerald-300 break-all font-mono mb-4">
          {link}
        </div>
        <Button full variant="secondary" onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copiado!'); }}>
          📋 Copiar link
        </Button>
      </Card>

      <Card className="p-6 lg:col-span-2 bg-gradient-to-br from-yellow-500/[0.06] to-emerald-500/[0.04]">
        <h3 className="font-bold mb-4">🏆 Distribuição do prêmio (se lotar)</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { m:'🥇', p:'1º', pct: bolao.prizeDistribution.first },
            { m:'🥈', p:'2º', pct: bolao.prizeDistribution.second },
            { m:'🥉', p:'3º', pct: bolao.prizeDistribution.third },
          ].map(x => (
            <div key={x.p} className="bg-slate-950/40 rounded-xl p-4 border border-white/[0.06] text-center">
              <div className="text-4xl">{x.m}</div>
              <div className="text-xs text-slate-400 mt-1">{x.p} — {x.pct}%</div>
              <div className="text-xl font-black text-yellow-300 mt-1">{brl(premioEst * x.pct / 100)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-white/[0.04] last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}

/* ── Participants ── */
function ParticipantsTab({ bolao }: { bolao: Bolao }) {
  const cotas = getCotasByBolao(bolao.id);
  if (cotas.length === 0) {
    return <EmptyState icon="👥" title="Nenhum participante" desc="Compartilhe o link para começar a receber inscrições." />;
  }
  function exportCSV() {
    const headers = ['Nome','E-mail','WhatsApp','Cotas','Valor','Status','Cód. Indicação','Indicado Por'];
    const rows = cotas.map(c => {
      const referredBy = c.referredByCotaId
        ? (cotas.find(x => x.id === c.referredByCotaId)?.participantName ?? c.referredByCotaId)
        : '';
      return [c.participantName, c.participantEmail, c.participantPhone,
        String(c.quantity), brl(c.totalAmount), c.paymentStatus, c.referralCode, referredBy];
    });
    const csv = [headers,...rows].map(r => r.map(x=>`"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download=`${bolao.slug}-participantes.csv`; a.click();
    toast.success('CSV exportado!');
  }
  return (
    <Card className="overflow-hidden animate-fadeIn">
      <div className="p-4 flex justify-between items-center border-b border-white/[0.06]">
        <h3 className="font-bold">Lista de participantes</h3>
        <Button size="sm" variant="secondary" onClick={exportCSV}>📥 Exportar CSV</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase text-slate-500 tracking-wider">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3 hidden sm:table-cell">Contato</th>
              <th className="text-center p-3">Cotas</th>
              <th className="text-right p-3">Valor</th>
              <th className="text-center p-3">Status</th>
              <th className="text-center p-3 hidden md:table-cell">Indicado por</th>
            </tr>
          </thead>
          <tbody>
            {cotas.map(c => {
              const referredBy = c.referredByCotaId
                ? cotas.find(x => x.id === c.referredByCotaId)?.participantName
                : null;
              return (
                <tr key={c.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="p-3 font-medium">{c.participantName}</td>
                  <td className="p-3 text-xs text-slate-500 hidden sm:table-cell">
                    {c.participantEmail}<br />{c.participantPhone}
                  </td>
                  <td className="p-3 text-center font-bold">{c.quantity}</td>
                  <td className="p-3 text-right">{brl(c.totalAmount)}</td>
                  <td className="p-3 text-center">
                    {c.paymentStatus==='paid'   ? <Badge color="emerald">Pago ✓</Badge>
                    :c.paymentStatus==='pending' ? <Badge color="yellow">Pendente</Badge>
                    :                              <Badge color="red">Falhou</Badge>}
                  </td>
                  <td className="p-3 text-center hidden md:table-cell">
                    {referredBy
                      ? <span className="text-xs text-yellow-300">🔗 {referredBy}</span>
                      : <span className="text-xs text-slate-600">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Ranking ── */
function RankingTab({ bolao }: { bolao: Bolao }) {
  const matches     = getMatches();
  const ranking     = rankBolao(bolao);
  const finishedCount = matches.filter(m => m.finished).length;
  return (
    <div className="animate-fadeIn">
      <Card className="p-4 mb-4 bg-blue-500/[0.08] border-blue-500/20 text-sm flex flex-wrap items-center gap-2">
        <span>ℹ️ <strong>{finishedCount}</strong> de {matches.length} jogos finalizados.</span>
        {finishedCount === 0 && (
          <button className="underline text-blue-300 text-xs" onClick={() => navigate('/organizador/results')}>
            Simular resultados →
          </button>
        )}
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase text-slate-500 tracking-wider">
            <tr>
              <th className="text-left p-3 w-12">#</th>
              <th className="text-left p-3">Participante</th>
              <th className="text-center p-3">Exatos</th>
              <th className="text-center p-3">Acertos</th>
              <th className="text-right p-3">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum participante ainda.</td></tr>
            )}
            {ranking.map((r, i) => (
              <tr key={r.ticketId} className={`border-t border-white/[0.04] ${i<3?'bg-yellow-500/[0.04]':''}`}>
                <td className="p-3 font-black">{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</td>
                <td className="p-3 font-medium">{r.ticketLabel}</td>
                <td className="p-3 text-center text-emerald-300">{r.exactScores}</td>
                <td className="p-3 text-center text-blue-300">{r.correctWinners}</td>
                <td className="p-3 text-right font-black text-lg">{r.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ── Indicações ── */
function ReferralsTab({ bolao }: { bolao: Bolao }) {
  const referrals  = getReferralsByBolao(bolao.id);
  const cotas      = getCotasByBolao(bolao.id).filter(c => c.paymentStatus === 'paid');
  const ranking    = rankBolao(bolao);
  const arrecadado = cotas.reduce((s,c) => s+c.totalAmount, 0);
  const prizePool  = arrecadado * (1 - bolao.commissionPercent / 100);

  const prizeByPlace: Record<number,number> = {
    1: prizePool * bolao.prizeDistribution.first  / 100,
    2: prizePool * bolao.prizeDistribution.second / 100,
    3: prizePool * bolao.prizeDistribution.third  / 100,
  };

  let totalPotential = 0;
  referrals.forEach(r => {
    const idx = ranking.findIndex(e => e.cotaId === r.referredCotaId);
    if (idx >= 0 && idx <= 2) totalPotential += prizeByPlace[idx+1] * bolao.referralBonusPercent / 100;
  });

  // Agrupado por referrer
  const byReferrer: Record<string, typeof referrals> = {};
  referrals.forEach(r => {
    if (!byReferrer[r.referrerCotaId]) byReferrer[r.referrerCotaId] = [];
    byReferrer[r.referrerCotaId].push(r);
  });

  return (
    <div className="animate-fadeIn space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-2">
        <Stat icon="🔗" label="Total indicações"    value={String(referrals.length)} accent="yellow" />
        <Stat icon="💰" label="Bônus potencial"     value={brl(totalPotential)}      accent="emerald" />
        <Stat icon="👥" label="Indicadores únicos"  value={String(Object.keys(byReferrer).length)} accent="blue" />
      </div>

      <Card className="p-4 bg-yellow-500/[0.06] border-yellow-500/15 text-sm text-yellow-200">
        🔗 <strong>Bônus de indicação: {bolao.referralBonusPercent}% do prêmio.</strong>{' '}
        Se um indicado chegar ao 1°, 2° ou 3° lugar, quem indicou recebe automaticamente
        {bolao.referralBonusPercent}% do prêmio do indicado via PIX, sem reduzir o prêmio de ninguém.
      </Card>

      {referrals.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-3">🔗</div>
          <p>Nenhuma indicação registrada ainda.</p>
          <p className="text-xs mt-1">Os participantes passarão a indicar amigos via seu link único.</p>
        </div>
      ) : (
        Object.entries(byReferrer).map(([referrerId, refs]) => {
          const referrerCota = cotas.find(c => c.id === referrerId);
          if (!referrerCota) return null;
          const refRankIdx = ranking.findIndex(r => r.cotaId === referrerId);
          let myBonus = 0;
          refs.forEach(r => {
            const idx = ranking.findIndex(e => e.cotaId === r.referredCotaId);
            if (idx >= 0 && idx <= 2) myBonus += prizeByPlace[idx+1] * bolao.referralBonusPercent / 100;
          });
          return (
            <Card key={referrerId} className="overflow-hidden">
              <div className="p-4 bg-white/[0.02] border-b border-white/[0.06] flex flex-wrap justify-between items-center gap-2">
                <div>
                  <div className="font-bold flex items-center gap-2">
                    🔗 {referrerCota.participantName}
                    <Badge color="yellow">{refs.length} indicado(s)</Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    {referrerCota.participantEmail} ·
                    posição: <strong className="text-white">
                      {refRankIdx >= 0 ? `#${refRankIdx+1}` : 'sem ranking'}
                    </strong>
                    {referrerCota.pixKeyForBonus &&
                      <> · PIX: <span className="font-mono text-emerald-300">{referrerCota.pixKeyForBonus}</span></>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Bônus potencial</div>
                  <div className={`font-black ${myBonus>0?'text-yellow-300':'text-slate-500'}`}>{brl(myBonus)}</div>
                </div>
              </div>
              {refs.map(r => {
                const idx   = ranking.findIndex(e => e.cotaId === r.referredCotaId);
                const pos   = idx >= 0 ? idx + 1 : null;
                const bonus = pos && pos <= 3 ? prizeByPlace[pos] * bolao.referralBonusPercent / 100 : 0;
                return (
                  <div key={r.id}
                    className="px-4 py-3 flex flex-wrap justify-between items-center gap-2 border-b border-white/[0.04] last:border-0 text-sm">
                    <div>
                      <span className="font-medium">{r.referredName}</span>
                      <span className="text-slate-500 text-xs ml-2">{r.referredEmail}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {pos ? <span>{pos===1?'🥇':pos===2?'🥈':pos===3?'🥉':`#${pos}`}</span>
                           : <span className="text-slate-600 text-xs">sem posição</span>}
                      {bonus > 0 && <span className="font-bold text-yellow-300">{brl(bonus)}</span>}
                      {r.bonusPaid && <Badge color="emerald">Pago ✓</Badge>}
                    </div>
                  </div>
                );
              })}
            </Card>
          );
        })
      )}
    </div>
  );
}

/* ── Financeiro ── */
function FinancialTab({ bolao }: { bolao: Bolao }) {
  const cotas = getCotasByBolao(bolao.id);
  const paid  = cotas.filter(c => c.paymentStatus === 'paid');
  const arrecadado = paid.reduce((s,c) => s+c.totalAmount, 0);
  const comissao   = arrecadado * (bolao.commissionPercent / 100);
  const premio     = arrecadado - comissao;
  return (
    <div className="grid lg:grid-cols-2 gap-5 animate-fadeIn">
      <Card className="p-6">
        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-400">💰 Resumo</h3>
        <Detail label="Total arrecadado"              value={brl(arrecadado)} />
        <Detail label={`Comissão (${bolao.commissionPercent}%)`} value={brl(comissao)} />
        <Detail label="Prêmio acumulado"              value={brl(premio)} />
        <Detail label="Bônus de indicação"            value={`${bolao.referralBonusPercent}% do prêmio do indicado`} />
        <Detail label="Pagamentos recebidos"          value={String(paid.length)} />
        <Button full size="lg" className="mt-6" onClick={() => {
          toast.info('Saque solicitado',
            `Em produção: ${brl(comissao)} transferido para ${bolao.pixKey} via PushinPay.`);
        }}>
          🏦 Solicitar saque ({brl(comissao)})
        </Button>
      </Card>
      <Card className="p-6">
        <h3 className="font-bold mb-4 text-sm uppercase tracking-wider text-slate-400">📜 Transações</h3>
        <div className="space-y-2 max-h-80 overflow-auto">
          {paid.length === 0 && <p className="text-sm text-slate-500">Sem transações.</p>}
          {paid.map(c => (
            <div key={c.id} className="flex justify-between items-start py-2.5 border-b border-white/[0.04] text-sm">
              <div>
                <div className="font-medium">{c.participantName}</div>
                <div className="text-[11px] text-slate-500">
                  {c.quantity} cota(s) · {new Date(c.paidAt||c.createdAt).toLocaleString('pt-BR')}
                  {c.referredByCotaId && <span className="ml-1 text-yellow-400">🔗 indicado</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-300">+{brl(c.totalAmount)}</div>
                <div className="text-[10px] text-slate-500">PIX ⚡</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
