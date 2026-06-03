import type { Cota, Match, Prediction, ScoringRules, Ticket } from '../types';

export type RankingEntry = {
  ticketId: string;
  cotaId: string;
  userId: string;
  participantName: string;
  ticketLabel: string;       // "Maria" ou "Maria (Palpite 2)"
  ticketIndex: number;
  cotaQuantity: number;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
};

export function calculatePoints(
  prediction: Prediction,
  match: Match,
  rules: ScoringRules
): number {
  if (!match.finished || match.homeScore == null || match.awayScore == null) return 0;

  const exact =
    prediction.homeScore === match.homeScore &&
    prediction.awayScore === match.awayScore;
  if (exact) return rules.exactScore;

  const predWinner =
    prediction.homeScore > prediction.awayScore ? 'home'
    : prediction.homeScore < prediction.awayScore ? 'away'
    : 'draw';
  const realWinner =
    match.homeScore > match.awayScore ? 'home'
    : match.homeScore < match.awayScore ? 'away'
    : 'draw';

  if (predWinner === realWinner) {
    if (realWinner === 'draw') return rules.correctDraw;
    const predDiff = prediction.homeScore - prediction.awayScore;
    const realDiff = match.homeScore - match.awayScore;
    if (predDiff === realDiff) return rules.correctWinner + rules.goalDifference;
    return rules.correctWinner;
  }
  return 0;
}

/**
 * Ranking por bilhete (ticket). Cada bilhete disputa de forma independente.
 * Apenas bilhetes de cotas pagas entram.
 */
export function computeRanking(
  cotas: Cota[],
  tickets: Ticket[],
  predictions: Prediction[],
  matches: Match[],
  rules: ScoringRules
): RankingEntry[] {
  const matchById = new Map(matches.map(m => [m.id, m]));
  const cotaById  = new Map(cotas.map(c => [c.id, c]));
  const paidCotaIds = new Set(cotas.filter(c => c.paymentStatus === 'paid').map(c => c.id));

  const eligibleTickets = tickets.filter(t => paidCotaIds.has(t.cotaId));

  const entries: RankingEntry[] = eligibleTickets.map(t => {
    const cota = cotaById.get(t.cotaId)!;
    const preds = predictions.filter(p => p.ticketId === t.id);
    let totalPoints = 0, exactScores = 0, correctWinners = 0;
    for (const p of preds) {
      const m = matchById.get(p.matchId);
      if (!m) continue;
      const pts = calculatePoints(p, m, rules);
      totalPoints += pts;
      if (pts === rules.exactScore) exactScores++;
      else if (pts >= rules.correctWinner) correctWinners++;
    }
    const label = cota.quantity > 1
      ? `${cota.participantName} (Palpite ${t.index})`
      : cota.participantName;
    return {
      ticketId: t.id,
      cotaId: cota.id,
      userId: cota.userId,
      participantName: cota.participantName,
      ticketLabel: label,
      ticketIndex: t.index,
      cotaQuantity: cota.quantity,
      totalPoints, exactScores, correctWinners,
    };
  });

  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
    return b.correctWinners - a.correctWinners;
  });

  return entries;
}

export function brl(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
