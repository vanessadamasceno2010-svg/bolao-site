import { useEffect, useState } from 'react';
import { Badge, Button, Card } from '../components/Layout';
import { navigate } from '../lib/router';
import { getBolaoBySlug, getCotasByBolao, getMatches, rankBolao, onStorageChange } from '../lib/storage';
import { brl, type RankingEntry } from '../lib/scoring';

export function Ranking({ slug }: { slug: string }) {
  const [, setTick] = useState(0);
  useEffect(() => onStorageChange(() => setTick(t => t + 1)), []);

  const bolao = getBolaoBySlug(slug);
  if (!bolao) return <Card className="p-12 text-center"><h2>Não encontrado</h2></Card>;

  const cotas = getCotasByBolao(bolao.id);
  const paid = cotas.filter(c => c.paymentStatus === 'paid');
  const arrecadado = paid.reduce((s, c) => s + c.totalAmount, 0);
  const premio = arrecadado * (1 - bolao.commissionPercent / 100);

  const matches = getMatches();
  const finished = matches.filter(m => m.finished).length;
  const ranking = rankBolao(bolao);

  return (
    <div className="max-w-3xl mx-auto animate-fadeInUp">
      <button onClick={() => navigate(`/b/${slug}`)} className="text-slate-400 hover:text-white text-sm mb-3">← Bolão</button>

      <div className="mb-6">
        <Badge color="emerald">{bolao.name}</Badge>
        <h1 className="text-3xl font-black mt-2">🏆 Classificação</h1>
        <p className="text-slate-400 text-sm mt-1">
          {finished}/{matches.length} jogos · Prêmio: <strong className="text-yellow-300">{brl(premio)}</strong>
        </p>
      </div>

      {/* Pódio */}
      {ranking.length >= 3 && finished > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <PodiumCard place={2} entry={ranking[1]} prize={premio * bolao.prizeDistribution.second / 100} />
          <PodiumCard place={1} entry={ranking[0]} prize={premio * bolao.prizeDistribution.first / 100} big />
          <PodiumCard place={3} entry={ranking[2]} prize={premio * bolao.prizeDistribution.third / 100} />
        </div>
      )}

      {/* Tabela */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-[10px] uppercase text-slate-500 tracking-wider">
            <tr>
              <th className="text-center p-3 w-12">#</th>
              <th className="text-left p-3">Participante</th>
              <th className="text-center p-3 hidden sm:table-cell">🎯 Exatos</th>
              <th className="text-center p-3 hidden sm:table-cell">✅ Acertos</th>
              <th className="text-right p-3">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {ranking.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">
                Nenhum participante ainda.
              </td></tr>
            )}
            {ranking.map((r, i) => (
              <tr key={r.ticketId} className={`border-t border-white/[0.04] transition-colors ${
                i === 0 ? 'bg-yellow-500/[0.06]' : i < 3 ? 'bg-yellow-500/[0.03]' : 'hover:bg-white/[0.02]'
              }`}>
                <td className="p-3 text-center">
                  <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                </td>
                <td className="p-3">
                  <div className="font-medium">{r.ticketLabel}</div>
                  <div className="text-[10px] text-slate-500 sm:hidden">
                    {r.exactScores} exatos · {r.correctWinners} acertos
                  </div>
                </td>
                <td className="p-3 text-center text-emerald-300 font-bold hidden sm:table-cell">{r.exactScores}</td>
                <td className="p-3 text-center text-blue-300 hidden sm:table-cell">{r.correctWinners}</td>
                <td className="p-3 text-right">
                  <span className="font-black text-xl">{r.totalPoints}</span>
                  <span className="text-[10px] text-slate-500 ml-1">pts</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {finished === 0 && (
        <Card className="p-4 mt-4 bg-blue-500/[0.06] border-blue-500/15 text-sm text-center text-blue-200">
          🕐 O ranking ficará disponível quando os jogos começarem.
          <button onClick={() => navigate('/organizador/results')} className="text-blue-300 underline text-xs ml-2">
            Simular resultados →
          </button>
        </Card>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <Button variant="secondary" onClick={() => navigate(`/b/${slug}`)}>← Voltar</Button>
        <Button variant="secondary" onClick={() => {
          const msg = `🏆 Ranking do ${bolao.name}\n\n` +
            ranking.slice(0, 5).map((r, i) => `${i + 1}. ${r.ticketLabel} — ${r.totalPoints} pts`).join('\n') +
            `\n\n⚽ Confira: ${window.location.href}`;
          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        }}>📲 Compartilhar ranking</Button>
      </div>
    </div>
  );
}

function PodiumCard({ place, entry, prize, big }: {
  place: 1 | 2 | 3; entry: RankingEntry; prize: number; big?: boolean;
}) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  const cls = {
    1: 'from-yellow-400/20 to-yellow-600/5 border-yellow-400/40 shadow-yellow-500/10',
    2: 'from-slate-300/15 to-slate-400/5 border-slate-400/30',
    3: 'from-orange-400/15 to-orange-500/5 border-orange-400/30',
  };
  return (
    <div className={`bg-gradient-to-b ${cls[place]} border rounded-2xl p-3 sm:p-5 text-center transition-all ${
      big ? 'scale-105 shadow-xl' : ''
    } ${place === 2 ? 'mt-4' : place === 3 ? 'mt-6' : ''}`}>
      <div className={big ? 'text-5xl sm:text-6xl' : 'text-4xl'}>{medals[place]}</div>
      <div className="font-bold mt-2 text-sm truncate">{entry.ticketLabel}</div>
      <div className="text-xl sm:text-2xl font-black mt-1">{entry.totalPoints}</div>
      <div className="text-[10px] text-slate-400">pontos</div>
      <div className="text-xs text-yellow-300 mt-1 font-semibold">{brl(prize)}</div>
    </div>
  );
}
