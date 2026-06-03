import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card } from '../components/Layout';
import { navigate } from '../lib/router';
import {
  getBolaoBySlug, getCotaById, getMatches,
  getPredictionsByTicket, getTicketsByCota, savePrediction,
} from '../lib/storage';
import { toast } from '../lib/toast';
import { STAGE_LABELS } from '../data/matches';
import type { Match, Prediction, Ticket } from '../types';

export function Predictions({ slug, cotaId }: { slug: string; cotaId: string }) {
  const bolao   = getBolaoBySlug(slug);
  const cota    = getCotaById(cotaId);
  const matches = getMatches();
  const tickets = getTicketsByCota(cotaId);

  const [activeTicketId, setActiveTicketId] = useState<string>(tickets[0]?.id ?? '');

  if (!bolao || !cota) {
    return <Card className="p-12 text-center"><h2 className="text-xl font-bold">Não encontrado</h2></Card>;
  }
  if (cota.paymentStatus !== 'paid') {
    return (
      <Card className="p-12 text-center max-w-lg mx-auto animate-fadeIn">
        <div className="text-5xl mb-3">🔒</div>
        <h2 className="text-xl font-bold">Pagamento pendente</h2>
        <p className="text-slate-400 mt-2 mb-4">Confirme o pagamento para fazer seus palpites.</p>
        <Button onClick={() => navigate(`/b/${slug}/join`)}>Voltar ao pagamento</Button>
      </Card>
    );
  }
  if (tickets.length === 0) {
    return (
      <Card className="p-12 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold">Nenhum bilhete encontrado</h2>
        <Button className="mt-4" onClick={() => navigate('/perfil')}>Ir ao painel</Button>
      </Card>
    );
  }

  const activeTicket = tickets.find(t => t.id === activeTicketId) ?? tickets[0];

  return (
    <div className="max-w-4xl mx-auto animate-fadeInUp">
      <button onClick={() => navigate('/perfil')} className="text-slate-400 hover:text-white text-sm mb-3">← Meu painel</button>

      <div className="mb-2">
        <h1 className="text-2xl sm:text-3xl font-black">🎯 Meus palpites</h1>
        <p className="text-slate-400 text-sm mt-1">
          <strong>{cota.participantName}</strong> · {cota.quantity} cota(s)/bilhete(s) · {bolao.name}
        </p>
      </div>

      {/* Seletor de bilhetes (quando há mais de 1 cota) */}
      {tickets.length > 1 && (
        <Card className="p-4 my-4 bg-emerald-500/[0.05] border-emerald-500/20">
          <div className="text-sm font-bold mb-2">🎟️ Selecione o bilhete para preencher</div>
          <p className="text-xs text-slate-400 mb-3">
            Você comprou {cota.quantity} cotas — preencha um conjunto de palpites para cada bilhete.
            Cada bilhete concorre separadamente no ranking.
          </p>
          <div className="flex flex-wrap gap-2">
            {tickets.map(t => {
              const filled = getPredictionsByTicket(t.id).length;
              const complete = filled >= matches.length;
              return (
                <button key={t.id} onClick={() => setActiveTicketId(t.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${
                    activeTicket.id === t.id
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}>
                  Bilhete {t.index}
                  <span className="ml-1.5 text-[10px] opacity-70">{filled}/{matches.length}</span>
                  {complete && <span className="ml-1 text-emerald-400">✓</span>}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Editor de palpites do bilhete ativo */}
      <TicketEditor key={activeTicket.id} ticket={activeTicket} matches={matches}
        bolao={bolao} slug={slug} totalTickets={tickets.length} />
    </div>
  );
}

/* ── Editor de um bilhete ── */
function TicketEditor({ ticket, matches, bolao, slug, totalTickets }: {
  ticket: Ticket; matches: Match[];
  bolao: ReturnType<typeof getBolaoBySlug>; slug: string; totalTickets: number;
}) {
  const existing = getPredictionsByTicket(ticket.id);

  const initial = useMemo(() => {
    const m: Record<string, { home: string; away: string }> = {};
    matches.forEach(mt => { m[mt.id] = { home: '', away: '' }; });
    existing.forEach(p => { m[p.matchId] = { home: String(p.homeScore), away: String(p.awayScore) }; });
    return m;
    // eslint-disable-next-line
  }, [ticket.id]);

  const [preds, setPreds] = useState(initial);
  const [stageFilter, setStageFilter] = useState<Match['stage'] | 'all'>('groups');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) { const t = setTimeout(() => setSaved(false), 3000); return () => clearTimeout(t); }
  }, [saved]);

  function updatePred(matchId: string, side: 'home'|'away', value: string) {
    const v = value.replace(/[^0-9]/g, '').slice(0, 2);
    setPreds(p => ({ ...p, [matchId]: { ...p[matchId], [side]: v } }));
  }

  function saveAll() {
    let count = 0;
    Object.entries(preds).forEach(([matchId, { home, away }]) => {
      if (home !== '' && away !== '') {
        const p: Prediction = { ticketId: ticket.id, matchId, homeScore: Number(home), awayScore: Number(away) };
        savePrediction(p);
        count++;
      }
    });
    setSaved(true);
    if (count === 0) toast.warning('Nenhum palpite', 'Preencha pelo menos um placar.');
    else toast.success(`${count} palpites salvos!`, totalTickets > 1 ? `Bilhete ${ticket.index}.` : 'Edite até a data limite.');
  }

  if (!bolao) return null;

  const stages: (Match['stage'] | 'all')[] = ['groups','r16','qf','sf','third','final','all'];
  const filtered = stageFilter === 'all' ? matches : matches.filter(m => m.stage === stageFilter);
  const totalFilled = Object.values(preds).filter(p => p.home !== '' && p.away !== '').length;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-2">
        {totalTickets > 1
          ? <Badge color="blue">Editando: Bilhete {ticket.index}</Badge>
          : <span />}
        <Badge color={totalFilled === matches.length ? 'emerald' : 'yellow'}>{totalFilled}/{matches.length}</Badge>
      </div>

      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden my-3">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-yellow-400 transition-all duration-500"
          style={{ width: `${(totalFilled / matches.length) * 100}%` }} />
      </div>

      <Card className="p-3 mb-4 bg-blue-500/[0.06] border-blue-500/15 text-sm text-blue-200">
        💡 Preencha os placares. Edite até <strong>{new Date(bolao.deadline).toLocaleDateString('pt-BR')}</strong>.
      </Card>

      <div className="flex flex-wrap gap-1 mb-5 border-b border-white/[0.06] overflow-x-auto">
        {stages.map(s => {
          const count = s === 'all' ? matches.length : matches.filter(m => m.stage === s).length;
          const filled = s === 'all'
            ? totalFilled
            : matches.filter(m => m.stage === s).filter(m => preds[m.id]?.home !== '' && preds[m.id]?.away !== '').length;
          return (
            <button key={s} onClick={() => setStageFilter(s)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition border-b-2 ${
                stageFilter === s ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-200'
              }`}>
              {s === 'all' ? 'Todos' : STAGE_LABELS[s]}
              <span className="ml-1 text-[10px] opacity-60">{filled}/{count}</span>
            </button>
          );
        })}
      </div>

      {stageFilter === 'groups' ? (
        ['A','B','C','D','E','F','G','H'].map(g => {
          const list = matches.filter(m => m.stage === 'groups' && m.group === g);
          if (list.length === 0) return null;
          const groupFilled = list.filter(m => preds[m.id]?.home !== '' && preds[m.id]?.away !== '').length;
          return (
            <div key={g} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-emerald-300 text-sm">Grupo {g}</h3>
                <span className="text-[10px] text-slate-500">{groupFilled}/{list.length}</span>
              </div>
              <div className="space-y-2">
                {list.map(m => <MatchRow key={m.id} match={m} pred={preds[m.id]} onChange={(s,v) => updatePred(m.id, s, v)} />)}
              </div>
            </div>
          );
        })
      ) : (
        <div className="space-y-2 mb-6">
          {filtered.map(m => <MatchRow key={m.id} match={m} pred={preds[m.id]} onChange={(s,v) => updatePred(m.id, s, v)} />)}
        </div>
      )}

      <div className="sticky bottom-3 z-20 mt-6">
        <Card className={`p-4 bg-slate-900/95 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-2xl transition-all ${
          saved ? 'border-emerald-500/40' : 'border-white/[0.08]'
        }`}>
          <div className="text-sm">
            {saved
              ? <span className="text-emerald-400 font-bold animate-fadeIn">✓ Salvos com sucesso!</span>
              : <span><strong className="text-white">{totalFilled}</strong>/{matches.length} preenchidos{totalTickets>1?` · Bilhete ${ticket.index}`:''}</span>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate(`/b/${slug}/ranking`)}>🏆 Ranking</Button>
            <Button size="sm" onClick={saveAll}>💾 Salvar palpites</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MatchRow({ match, pred, onChange }: {
  match: Match; pred: { home: string; away: string };
  onChange: (side: 'home'|'away', v: string) => void;
}) {
  const date = new Date(match.date);
  const filled = pred?.home !== '' && pred?.away !== '';
  return (
    <Card className={`p-3 transition-all ${match.finished ? 'border-yellow-500/20' : filled ? 'border-emerald-500/15 bg-emerald-500/[0.02]' : ''}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-[10px] text-slate-600 w-12 sm:w-16 shrink-0 text-center">
          {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}<br />
          <span className="text-slate-500">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2">
          <div className="text-right flex items-center justify-end gap-1">
            <span className="font-medium text-xs sm:text-sm truncate">{match.homeTeam}</span>
            <span className="text-sm sm:text-base">{match.homeFlag}</span>
          </div>
          <div className="flex items-center gap-1">
            <input type="text" inputMode="numeric" value={pred?.home ?? ''}
              onChange={e => onChange('home', e.target.value)}
              className="w-9 h-9 sm:w-10 sm:h-10 text-center text-base sm:text-lg font-black bg-slate-950/50 border border-white/10 rounded-lg focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition" />
            <span className="text-slate-600 font-bold text-xs">×</span>
            <input type="text" inputMode="numeric" value={pred?.away ?? ''}
              onChange={e => onChange('away', e.target.value)}
              className="w-9 h-9 sm:w-10 sm:h-10 text-center text-base sm:text-lg font-black bg-slate-950/50 border border-white/10 rounded-lg focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition" />
          </div>
          <div className="text-left flex items-center gap-1">
            <span className="text-sm sm:text-base">{match.awayFlag}</span>
            <span className="font-medium text-xs sm:text-sm truncate">{match.awayTeam}</span>
          </div>
        </div>
        {filled && !match.finished && <span className="text-emerald-400 text-xs shrink-0">✓</span>}
      </div>
      {match.finished && match.homeScore != null && (
        <div className="text-center text-[11px] text-yellow-300 mt-2 border-t border-white/[0.04] pt-2">
          Resultado: <strong>{match.homeScore} × {match.awayScore}</strong>
        </div>
      )}
    </Card>
  );
}
