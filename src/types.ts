export type ScoringRules = {
  exactScore: number;
  correctWinner: number;
  correctDraw: number;
  goalDifference: number;
};

export type PrizeDistribution = {
  first: number;
  second: number;
  third: number;
};

export type Bolao = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  organizerName: string;
  organizerEmail: string;
  pixKey: string;
  shareValue: number;
  totalShares: number;
  deadline: string;
  scoringRules: ScoringRules;
  prizeDistribution: PrizeDistribution;
  commissionPercent: number;
  referralBonusPercent: number; // % do PRÊMIO do indicado que vai para quem indicou (padrão 5)
  createdAt: string;
  status: 'open' | 'filled' | 'closed';
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  passwordHash: string;       // hash simples (demo). Em produção: Supabase Auth.
  pixKeyForBonus?: string;    // chave PIX para receber bônus de indicação
  createdAt: string;
};

export type Cota = {
  id: string;
  bolaoId: string;
  userId: string;             // dono da cota (conta de usuário)
  participantName: string;
  participantEmail: string;
  participantPhone: string;
  quantity: number;           // quantas cotas/bilhetes comprou
  totalAmount: number;
  paymentMethod: 'pix' | 'card';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  createdAt: string;
  pixCode?: string;
  referralCode: string;       // código único desta cota para indicar outros
  referredByCotaId?: string;  // cotaId de quem indicou esta pessoa (se houver)
  pixKeyForBonus?: string;    // chave PIX para receber bônus de indicação
};

// Cada cota de quantidade N gera N bilhetes. Cada bilhete tem palpites próprios
// e disputa o ranking de forma independente.
export type Ticket = {
  id: string;
  cotaId: string;
  bolaoId: string;
  userId: string;
  index: number;              // 1-based (Palpite 1, Palpite 2, ...)
  createdAt: string;
};

export type ReferralBonus = {
  id: string;
  bolaoId: string;
  referrerCotaId: string;     // quem indicou
  referredCotaId: string;     // quem foi indicado
  referredName: string;
  referredEmail: string;
  place?: 1 | 2 | 3;         // colocação do indicado no final
  prizeAmount?: number;       // prêmio do indicado
  bonusAmount?: number;       // 5% do prêmio do indicado
  bonusPaid: boolean;
  createdAt: string;
};

export type Match = {
  id: string;
  stage: 'groups' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final';
  group?: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore?: number;
  awayScore?: number;
  finished: boolean;
};

export type Prediction = {
  ticketId: string;          // palpite vinculado a um bilhete específico
  matchId: string;
  homeScore: number;
  awayScore: number;
};

export type Transaction = {
  id: string;
  bolaoId: string;
  cotaId: string;
  type: 'cota_payment' | 'commission' | 'prize_payout' | 'referral_bonus';
  amount: number;
  date: string;
  description: string;
};
