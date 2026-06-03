import type { Bolao, Cota, Match, Prediction, ReferralBonus, Ticket, Transaction, User } from '../types';
import { WORLD_CUP_2026_MATCHES } from '../data/matches';
import { computeRanking, type RankingEntry } from './scoring';

const SCHEMA_VERSION = '3'; // bump força limpeza de dados antigos incompatíveis

const K = {
  version:      'bc26_version',
  boloes:       'bc26_boloes',
  users:        'bc26_users',
  cotas:        'bc26_cotas',
  tickets:      'bc26_tickets',
  predictions:  'bc26_predictions',
  matches:      'bc26_matches',
  transactions: 'bc26_transactions',
  referrals:    'bc26_referrals',
  currentUser:  'bc26_currentUser',
  session:      'bc26_participant_session',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('bc26:change', { detail: { key } }));
}

/* ── Versionamento (limpa dados antigos quando o schema muda) ── */
function ensureSchema() {
  const v = localStorage.getItem(K.version);
  if (v !== SCHEMA_VERSION) {
    Object.values(K).forEach(key => { if (key !== K.version) localStorage.removeItem(key); });
    localStorage.setItem(K.version, SCHEMA_VERSION);
  }
}

/* ── Utils ── */
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const makeReferralCode = (name: string) =>
  name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '').slice(0, 6)
  + Math.random().toString(36).slice(2, 5).toUpperCase();

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

const normEmail = (e: string) => e.trim().toLowerCase();
const normUser  = (u: string) => u.trim().toLowerCase();

/** Hash simples só para demonstração. Em produção: Supabase Auth (bcrypt). */
export function hashPassword(pw: string): string {
  let h = 0;
  for (let i = 0; i < pw.length; i++) { h = (h << 5) - h + pw.charCodeAt(i); h |= 0; }
  return 'h' + Math.abs(h).toString(36) + '_' + pw.length;
}

/* ── Bolões ── */
export const getBoloes  = () => read<Bolao[]>(K.boloes, []);
export const saveBolao  = (b: Bolao) => {
  const all = getBoloes();
  const idx = all.findIndex(x => x.id === b.id);
  if (idx >= 0) all[idx] = b; else all.push(b);
  write(K.boloes, all);
};
export const getBolaoBySlug = (slug: string) => getBoloes().find(b => b.slug === slug);
export const getBolaoById   = (id: string)   => getBoloes().find(b => b.id === id);

/* ── Users (contas de participante) ── */
export const getUsers = () => read<User[]>(K.users, []);
export const saveUser = (u: User) => {
  const all = getUsers();
  const idx = all.findIndex(x => x.id === u.id);
  if (idx >= 0) all[idx] = u; else all.push(u);
  write(K.users, all);
};
export const getUserById       = (id: string) => getUsers().find(u => u.id === id);
export const getUserByUsername = (username: string) =>
  getUsers().find(u => normUser(u.username) === normUser(username));
export const getUserByEmail    = (email: string) =>
  getUsers().find(u => normEmail(u.email) === normEmail(email));

/** Cria uma conta de usuário. Lança erro se username/e-mail já existir. */
export function createUser(data: {
  name: string; email: string; phone: string;
  username: string; password: string; pixKeyForBonus?: string;
}): User {
  if (getUserByUsername(data.username)) throw new Error('Este nome de usuário já está em uso.');
  if (getUserByEmail(data.email))       throw new Error('Já existe uma conta com este e-mail.');
  const user: User = {
    id: uid(),
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    username: data.username.trim(),
    passwordHash: hashPassword(data.password),
    pixKeyForBonus: data.pixKeyForBonus?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  saveUser(user);
  return user;
}

/** Autentica por username OU e-mail + senha. */
export function authenticate(usernameOrEmail: string, password: string): User | null {
  const u = getUserByUsername(usernameOrEmail) ?? getUserByEmail(usernameOrEmail);
  if (!u) return null;
  return u.passwordHash === hashPassword(password) ? u : null;
}

export function updateUser(userId: string, data: Partial<Pick<User,'name'|'email'|'phone'|'pixKeyForBonus'>> & { password?: string }) {
  const all = getUsers();
  const idx = all.findIndex(u => u.id === userId);
  if (idx < 0) return false;
  const u = all[idx];
  if (data.name  !== undefined) u.name  = data.name.trim();
  if (data.email !== undefined) u.email = data.email.trim();
  if (data.phone !== undefined) u.phone = data.phone.trim();
  if (data.pixKeyForBonus !== undefined) u.pixKeyForBonus = data.pixKeyForBonus.trim() || undefined;
  if (data.password) u.passwordHash = hashPassword(data.password);
  all[idx] = u;
  write(K.users, all);
  // Propaga dados para as cotas do usuário
  const cotas = getCotas();
  let cChanged = false;
  cotas.forEach(c => {
    if (c.userId === userId) {
      if (data.name  !== undefined) c.participantName  = u.name;
      if (data.email !== undefined) c.participantEmail = u.email;
      if (data.phone !== undefined) c.participantPhone = u.phone;
      if (data.pixKeyForBonus !== undefined) c.pixKeyForBonus = u.pixKeyForBonus;
      cChanged = true;
    }
  });
  if (cChanged) write(K.cotas, cotas);
  return true;
}

/* ── Cotas ── */
export const getCotas          = () => read<Cota[]>(K.cotas, []);
export const saveCota          = (c: Cota) => {
  const all = getCotas();
  const idx = all.findIndex(x => x.id === c.id);
  if (idx >= 0) all[idx] = c; else all.push(c);
  write(K.cotas, all);
};
export const getCotasByBolao   = (bolaoId: string) => getCotas().filter(c => c.bolaoId === bolaoId);
export const getCotaById       = (id: string)       => getCotas().find(c => c.id === id);
export const getCotaByReferral = (code: string)     => getCotas().find(c => c.referralCode === code);
export const getCotasByUser    = (userId: string)   => getCotas().filter(c => c.userId === userId);
export const getUserCotaInBolao = (userId: string, bolaoId: string) =>
  getCotas().find(c => c.userId === userId && c.bolaoId === bolaoId);

/* ── Tickets (bilhetes) ── */
export const getTickets         = () => read<Ticket[]>(K.tickets, []);
export const saveTicket         = (t: Ticket) => {
  const all = getTickets();
  const idx = all.findIndex(x => x.id === t.id);
  if (idx >= 0) all[idx] = t; else all.push(t);
  write(K.tickets, all);
};
export const getTicketById      = (id: string)      => getTickets().find(t => t.id === id);
export const getTicketsByCota   = (cotaId: string)  => getTickets().filter(t => t.cotaId === cotaId).sort((a,b)=>a.index-b.index);
export const getTicketsByBolao  = (bolaoId: string) => getTickets().filter(t => t.bolaoId === bolaoId);
export const getTicketsByUser   = (userId: string)  => getTickets().filter(t => t.userId === userId);

/** Cria N bilhetes para uma cota (idempotente: não duplica). */
export function createTicketsForCota(cota: Cota): Ticket[] {
  const existing = getTicketsByCota(cota.id);
  if (existing.length >= cota.quantity) return existing;
  const all = getTickets();
  for (let i = existing.length; i < cota.quantity; i++) {
    all.push({
      id: uid(),
      cotaId: cota.id,
      bolaoId: cota.bolaoId,
      userId: cota.userId,
      index: i + 1,
      createdAt: new Date().toISOString(),
    });
  }
  write(K.tickets, all);
  return getTicketsByCota(cota.id);
}

/* ── Matches ── */
export const getMatches = (): Match[] => {
  const stored = read<Match[] | null>(K.matches, null);
  if (!stored || stored.length === 0) {
    write(K.matches, WORLD_CUP_2026_MATCHES);
    return WORLD_CUP_2026_MATCHES;
  }
  return stored;
};
export const saveMatches = (matches: Match[]) => write(K.matches, matches);
export const updateMatchResult = (matchId: string, homeScore: number, awayScore: number) => {
  const all = getMatches();
  const idx = all.findIndex(m => m.id === matchId);
  if (idx >= 0) { all[idx] = { ...all[idx], homeScore, awayScore, finished: true }; saveMatches(all); }
};
export const resetMatches = () => write(K.matches, WORLD_CUP_2026_MATCHES);

/* ── Predictions (por bilhete) ── */
export const getPredictions       = () => read<Prediction[]>(K.predictions, []);
export const savePrediction       = (p: Prediction) => {
  const all = getPredictions();
  const idx = all.findIndex(x => x.ticketId === p.ticketId && x.matchId === p.matchId);
  if (idx >= 0) all[idx] = p; else all.push(p);
  write(K.predictions, all);
};
export const getPredictionsByTicket = (ticketId: string) => getPredictions().filter(p => p.ticketId === ticketId);

/* ── Transactions ── */
export const getTransactions        = () => read<Transaction[]>(K.transactions, []);
export const saveTransaction        = (t: Transaction) => { const all = getTransactions(); all.push(t); write(K.transactions, all); };
export const getTransactionsByBolao = (bolaoId: string) => getTransactions().filter(t => t.bolaoId === bolaoId);

/* ── Referrals ── */
export const getReferrals            = () => read<ReferralBonus[]>(K.referrals, []);
export const saveReferral            = (r: ReferralBonus) => {
  const all = getReferrals();
  const idx = all.findIndex(x => x.id === r.id);
  if (idx >= 0) all[idx] = r; else all.push(r);
  write(K.referrals, all);
};
export const getReferralsByReferrer  = (cotaId: string) => getReferrals().filter(r => r.referrerCotaId === cotaId);
export const getReferralsByBolao     = (bolaoId: string) => getReferrals().filter(r => r.bolaoId === bolaoId);

export const getReferralLink = (bolaoSlug: string, referralCode: string): string => {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/b/${bolaoSlug}/join?ref=${referralCode}`;
};

/* ── Ranking helper (por bilhete) ── */
export const rankBolao = (bolao: Bolao): RankingEntry[] =>
  computeRanking(
    getCotasByBolao(bolao.id),
    getTicketsByBolao(bolao.id),
    getPredictions(),
    getMatches(),
    bolao.scoringRules
  );

/** Melhor posição (1-based) entre os bilhetes de uma cota. null se nenhum. */
export const getBestPositionForCota = (bolao: Bolao, cotaId: string): number | null => {
  const ranking = rankBolao(bolao);
  let best: number | null = null;
  ranking.forEach((e, i) => {
    if (e.cotaId === cotaId && (best === null || i + 1 < best)) best = i + 1;
  });
  return best;
};

/* ── Current User (organizer) ── */
const K_ORG = 'bc26_org_session';
export type OrgUser = { id: string; name: string; email: string; };

export const getOrgSession = () => read<OrgUser | null>(K_ORG, null);
export const setOrgSession = (u: OrgUser | null) => {
  if (u) localStorage.setItem(K_ORG, JSON.stringify(u));
  else localStorage.removeItem(K_ORG);
  window.dispatchEvent(new CustomEvent('bc26:change', { detail: { key: K_ORG } }));
};

/** Login ou cadastro rápido do organizador. Em produção: Supabase Auth. */
export const orgLogin = (name: string, email: string, password: string): OrgUser => {
  // Busca organizador existente pelo e-mail
  const existing = read<{ id: string; name: string; email: string; pw: string }[]>('bc26_org_users', []);
  const found = existing.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  if (found) {
    if (found.pw !== password) throw new Error('Senha incorreta.');
    const org: OrgUser = { id: found.id, name: found.name, email: found.email };
    setOrgSession(org);
    return org;
  }
  // Cria novo organizador
  const org: OrgUser = { id: uid(), name: name.trim(), email: email.trim() };
  existing.push({ ...org, pw: password });
  localStorage.setItem('bc26_org_users', JSON.stringify(existing));
  setOrgSession(org);
  return org;
};

export const orgLogout = () => setOrgSession(null);

/** Retorna o ID do bolão pelo slug (usado no gerenciamento) */
export const getBolaoIdBySlug = (slug: string) => {
  const b = getBolaoBySlug(slug);
  return b?.id;
};

/* ── Recuperação de senha — organizador ── */
type OrgUserRecord = { id: string; name: string; email: string; pw: string; };

function getOrgUsers(): OrgUserRecord[] {
  return read<OrgUserRecord[]>('bc26_org_users', []);
}

/** Verifica se e-mail do organizador existe. Se sim, "envia" e-mail de recuperação (demo). */
export const orgRequestPasswordReset = (email: string): { ok: boolean; message: string; tempPassword?: string } => {
  const users = getOrgUsers();
  const user = users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  if (!user) return { ok: false, message: 'Nenhuma conta encontrada com este e-mail.' };

  // Em produção: enviar e-mail com link de reset. Na demo: gera senha temporária.
  const tempPw = 'R' + Math.random().toString(36).slice(2, 8);
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    users[idx].pw = tempPw;
    localStorage.setItem('bc26_org_users', JSON.stringify(users));
  }

  // Em produção: enviar e-mail real via Resend API.
  // Retorna dados para a tela exibir a mensagem.

  return {
    ok: true,
    message: `Um e-mail foi enviado para ${user.email} com uma nova senha temporária.`,
    tempPassword: tempPw, // só na demo — em produção, remover e enviar por e-mail
  };
};

/** Redefine a senha do organizador (chamado pela tela de recuperação). */
export const orgResetPassword = (email: string, newPassword: string): boolean => {
  const users = getOrgUsers();
  const idx = users.findIndex(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  if (idx < 0) return false;
  users[idx].pw = newPassword;
  localStorage.setItem('bc26_org_users', JSON.stringify(users));
  return true;
};

/* ── Recuperação de senha — participante ── */
export const participantRequestPasswordReset = (usernameOrEmail: string): { ok: boolean; message: string; tempPassword?: string; username?: string } => {
  const users = getUsers();
  const user = users.find(u =>
    normUser(u.username) === normUser(usernameOrEmail) ||
    normEmail(u.email) === normEmail(usernameOrEmail)
  );
  if (!user) return { ok: false, message: 'Nenhuma conta encontrada com este e-mail/usuário.' };

  const tempPw = 'R' + Math.random().toString(36).slice(2, 8);
  const all = getUsers();
  const idx = all.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    all[idx].passwordHash = hashPassword(tempPw);
    write(K.users, all);
  }

  return {
    ok: true,
    message: `Um e-mail foi enviado para ${user.email} com sua nova senha temporária.`,
    tempPassword: tempPw,
    username: user.username,
  };
};

export const participantResetPassword = (userId: string, newPassword: string): boolean => {
  return updateUser(userId, { password: newPassword });
};

/* ── Sessão do participante (perfil) ── */
export const getParticipantSession = () => read<{ userId: string } | null>(K.session, null);
export const setParticipantSession = (s: { userId: string } | null) => {
  if (s) localStorage.setItem(K.session, JSON.stringify(s));
  else   localStorage.removeItem(K.session);
  window.dispatchEvent(new CustomEvent('bc26:change', { detail: { key: K.session } }));
};
export const getLoggedUser = (): User | null => {
  const s = getParticipantSession();
  return s ? (getUserById(s.userId) ?? null) : null;
};

export const onStorageChange = (cb: () => void) => {
  const handler = () => cb();
  window.addEventListener('bc26:change', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('bc26:change', handler);
    window.removeEventListener('storage', handler);
  };
};

/* ── Seed demo ── */
export const seedDemoIfEmpty = () => {
  ensureSchema();
  if (getBoloes().length > 0) return;

  const demoId = uid();
  const demo: Bolao = {
    id: demoId,
    slug: 'copa-2026-demo',
    name: 'Bolão Copa 2026 — Demo Galera',
    description: 'Bolão demonstração entre amigos. Bora ver quem manja!',
    organizerName: 'João Organizador',
    organizerEmail: 'joao@exemplo.com',
    pixKey: 'joao@exemplo.com',
    shareValue: 50,
    totalShares: 50,
    deadline: '2026-06-10T23:59:00',
    scoringRules: { exactScore: 3, correctWinner: 1, correctDraw: 2, goalDifference: 2 },
    prizeDistribution: { first: 50, second: 30, third: 20 },
    commissionPercent: 12,
    referralBonusPercent: 5,
    createdAt: new Date().toISOString(),
    status: 'open',
  };
  saveBolao(demo);

  // [nome, email, telefone, username, senha, quantidade de cotas]
  const people: [string, string, string, string, string, number][] = [
    ['Pedro Silva',    'pedro@ex.com',  '11999990001', 'pedro',  '123456', 3],
    ['Maria Santos',   'maria@ex.com',  '11999990002', 'maria',  '123456', 1],
    ['Carlos Oliveira','carlos@ex.com', '11999990003', 'carlos', '123456', 2],
    ['Ana Costa',      'ana@ex.com',    '11999990004', 'ana',    '123456', 1],
    ['Lucas Souza',    'lucas@ex.com',  '11999990005', 'lucas',  '123456', 1],
  ];

  const cotaIds: string[] = [];
  const allTicketIds: { ticketId: string; seed: number }[] = [];

  people.forEach(([n, e, p, username, pw, qty], i) => {
    const user = createUser({ name: n, email: e, phone: p, username, password: pw, pixKeyForBonus: e });
    const cotaId = uid();
    cotaIds.push(cotaId);
    const cota: Cota = {
      id: cotaId,
      bolaoId: demoId,
      userId: user.id,
      participantName: n,
      participantEmail: e,
      participantPhone: p,
      quantity: qty,
      totalAmount: qty * 50,
      paymentMethod: 'pix',
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      referralCode: makeReferralCode(n),
      pixKeyForBonus: e,
      referredByCotaId: i === 1 ? cotaIds[0] : i === 2 ? cotaIds[0] : i === 3 ? cotaIds[1] : undefined,
    };
    saveCota(cota);
    saveTransaction({ id: uid(), bolaoId: demoId, cotaId, type: 'cota_payment',
      amount: cota.totalAmount, date: cota.paidAt!, description: `Pagamento ${qty} cota(s) — ${n}` });
    saveTransaction({ id: uid(), bolaoId: demoId, cotaId, type: 'commission',
      amount: cota.totalAmount * 0.12, date: cota.paidAt!, description: `Comissão 12% — ${n}` });

    const tickets = createTicketsForCota(cota);
    tickets.forEach((t, ti) => allTicketIds.push({ ticketId: t.id, seed: i * 1000 + ti * 137 + 17 }));
  });

  // Referrals demo
  const demoCotas = cotaIds.map((id, i) => ({ id, name: people[i][0], email: people[i][1] }));
  const refLinks: [number, number][] = [[0,1],[0,2],[1,3]];
  refLinks.forEach(([ri, di]) => {
    saveReferral({
      id: uid(),
      bolaoId: demoId,
      referrerCotaId: demoCotas[ri].id,
      referredCotaId: demoCotas[di].id,
      referredName: demoCotas[di].name,
      referredEmail: demoCotas[di].email,
      bonusPaid: false,
      createdAt: new Date().toISOString(),
    });
  });

  // Palpites demo (cada bilhete preenche a fase de grupos)
  const demoMatches = getMatches();
  const rng = (seed: number) => {
    let s = seed;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  };
  allTicketIds.forEach(({ ticketId, seed }) => {
    const random = rng(seed * 12345 + 67890);
    demoMatches.forEach(match => {
      if (match.stage !== 'groups') return;
      savePrediction({ ticketId, matchId: match.id,
        homeScore: Math.floor(random() * 4), awayScore: Math.floor(random() * 3) });
    });
  });
};
