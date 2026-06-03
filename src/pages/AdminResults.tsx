import { useState } from 'react';
import { Badge, Button, Card } from '../components/Layout';
import { getMatches, resetMatches, updateMatchResult } from '../lib/storage';
import { toast } from '../lib/toast';
import { STAGE_LABELS } from '../data/matches';
import type { Match } from '../types';
import { navigate } from '../lib/router';

export function AdminResults() {
  const [, setTick] = useState(0);
  const matches = getMatches();
  const [filter, setFilter] = useState<Match['stage'] | 'all'>('groups');

  function setResult(matchId: string, home: number, away: number) {
    updateMatchResult(matchId, home, away);
    setTick(t => t + 1);
    toast.success('Resultado salvo!', 'Rankings atualizados automaticamente.');
  }

  function simulateRandom() {
    if (!confirm('Simular resultados aleatórios para os jogos da fase de grupos não finalizados?')) return;
    let count = 0;
    matches.filter(m => m.stage === 'groups' && !m.finished).forEach(m => {
      updateMatchResult(m.id, Math.floor(Math.random() * 4), Math.floor(Math.random() * 4));
      count++;
    });
    setTick(t => t + 1);
    toast.success(`${count} resultados simulados!`, 'Confira o ranking atualizado.');
  }

  function resetAll() {
    if (!confirm('Apagar todos os resultados? Isso vai zerar os rankings.')) return;
    resetMatches();
    setTick(t => t + 1);
    toast.info('Resultados resetados.', 'Todos os jogos voltaram ao estado inicial.');
  }

  const filtered = filter === 'all' ? matches : matches.filter(m => m.stage === filter);
  const totalFinished = matches.filter(m => m.finished).length;

  return (
    <div className="max-w-4xl mx-auto animate-fadeInUp">
      <button onClick={() => navigate('/organizador/dashboard')} className="text-slate-400 hover:text-white text-sm mb-3">← Painel</button>

      <div className="mb-6">
        <Badge color="yellow">⚙️ Painel Admin</Badge>
        <h1 className="text-3xl font-black mt-2">Resultados dos jogos</h1>
        <p className="text-slate-400 text-sm mt-1">
          Registre os resultados. O ranking de todos os bolões atualiza automaticamente.
        </p>
      </div>

      <Card className="p-4 mb-5 bg-yellow-500/[0.06] border-yellow-500/15 text-sm text-yellow-200">
        <strong>ℹ️ Em produção:</strong> resultados puxados automaticamente via <strong>API-Football</strong> (api-football.com).
        Webhook dispara cálculo instantâneo de pontos e atualiza rankings em tempo real.
      </Card>

      <div className="flex flex-wrap gap-2 mb-5">
        <Button size="sm" variant="secondary" onClick={simulateRandom}>🎲 Simular grupos</Button>
        <Button size="sm" variant="danger" onClick={resetAll}>🔄 Resetar</Button>
        <div className="ml-auto text-sm text-slate-400 self-center">
          <strong className="text-emerald-300">{totalFinished}</strong>/{matches.length} finalizados
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-5 border-b border-white/[0.06] overflow-x-auto">
        {(['groups', 'r16', 'qf', 'sf', 'third', 'final', 'all'] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition border-b-2 ${
              filter === s ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-500 hover:text-slate-200'
            }`}>
            {s === 'all' ? 'Todos' : STAGE_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(m => <AdminMatchRow key={m.id} match={m} onSet={setResult} />)}
      </div>
    </div>
  );
}

function AdminMatchRow({ match, onSet }: { match: Match; onSet: (id: string, h: number, a: number) => void }) {
  const [home, setHome] = useState(match.homeScore?.toString() ?? '');
  const [away, setAway] = useState(match.awayScore?.toString() ?? '');

  function save() {
    const h = parseInt(home, 10), a = parseInt(away, 10);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) { toast.error('Inválido', 'Insira números válidos.'); return; }
    onSet(match.id, h, a);
  }

  return (
    <Card className={`p-3 transition-all ${match.finished ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : ''}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-[10px] text-slate-600 w-14 sm:w-16 shrink-0 text-center">
          {new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          {match.group && <><br /><span className="text-emerald-400/60">Grupo {match.group}</span></>}
        </div>
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-1 sm:gap-2">
          <div className="text-right text-xs sm:text-sm">
            {match.homeFlag} <strong>{match.homeTeam}</strong>
          </div>
          <div className="flex items-center gap-1">
            <input type="text" inputMode="numeric" value={home}
              onChange={e => setHome(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              className="w-9 h-9 sm:w-10 sm:h-10 text-center font-black bg-slate-950/50 border border-white/10 rounded-lg focus:border-emerald-400 focus:outline-none transition" />
            <span className="font-bold text-xs text-slate-600">×</span>
            <input type="text" inputMode="numeric" value={away}
              onChange={e => setAway(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              className="w-9 h-9 sm:w-10 sm:h-10 text-center font-black bg-slate-950/50 border border-white/10 rounded-lg focus:border-emerald-400 focus:outline-none transition" />
          </div>
          <div className="text-left text-xs sm:text-sm">
            <strong>{match.awayTeam}</strong> {match.awayFlag}
          </div>
        </div>
        <Button size="sm" onClick={save}>
          {match.finished ? '✓' : '💾'}
        </Button>
      </div>
    </Card>
  );
}
