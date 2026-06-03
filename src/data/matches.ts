import type { Match } from '../types';

// Calendário simulado dos 48 jogos principais da Copa 2026 (3 sedes: EUA, México, Canadá)
// Para a demonstração focamos em fase de grupos + mata-mata principais.

const F = {
  BR: '🇧🇷', AR: '🇦🇷', FR: '🇫🇷', ES: '🇪🇸', DE: '🇩🇪', EN: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  PT: '🇵🇹', NL: '🇳🇱', IT: '🇮🇹', BE: '🇧🇪', HR: '🇭🇷', UY: '🇺🇾',
  CO: '🇨🇴', MX: '🇲🇽', US: '🇺🇸', CA: '🇨🇦', JP: '🇯🇵', KR: '🇰🇷',
  AU: '🇦🇺', MA: '🇲🇦', SN: '🇸🇳', CI: '🇨🇮', EC: '🇪🇨', CH: '🇨🇭',
  DK: '🇩🇰', PL: '🇵🇱', SR: '🇷🇸', AT: '🇦🇹', NG: '🇳🇬', GH: '🇬🇭',
  IR: '🇮🇷', QA: '🇶🇦',
};

let id = 1;
const mk = (
  stage: Match['stage'],
  group: string | undefined,
  date: string,
  home: string,
  homeFlag: string,
  away: string,
  awayFlag: string
): Match => ({
  id: `m${id++}`,
  stage,
  group,
  date,
  homeTeam: home,
  awayTeam: away,
  homeFlag,
  awayFlag,
  finished: false,
});

export const WORLD_CUP_2026_MATCHES: Match[] = [
  // ==== GRUPO A ====
  mk('groups', 'A', '2026-06-11T20:00:00', 'México', F.MX, 'Canadá', F.CA),
  mk('groups', 'A', '2026-06-12T18:00:00', 'Marrocos', F.MA, 'Suíça', F.CH),
  mk('groups', 'A', '2026-06-17T20:00:00', 'México', F.MX, 'Suíça', F.CH),
  mk('groups', 'A', '2026-06-17T17:00:00', 'Canadá', F.CA, 'Marrocos', F.MA),
  mk('groups', 'A', '2026-06-23T16:00:00', 'México', F.MX, 'Marrocos', F.MA),
  mk('groups', 'A', '2026-06-23T16:00:00', 'Suíça', F.CH, 'Canadá', F.CA),

  // ==== GRUPO B ====
  mk('groups', 'B', '2026-06-12T16:00:00', 'EUA', F.US, 'Equador', F.EC),
  mk('groups', 'B', '2026-06-13T13:00:00', 'Inglaterra', F.EN, 'Senegal', F.SN),
  mk('groups', 'B', '2026-06-18T16:00:00', 'EUA', F.US, 'Senegal', F.SN),
  mk('groups', 'B', '2026-06-18T19:00:00', 'Equador', F.EC, 'Inglaterra', F.EN),
  mk('groups', 'B', '2026-06-24T16:00:00', 'EUA', F.US, 'Inglaterra', F.EN),
  mk('groups', 'B', '2026-06-24T16:00:00', 'Senegal', F.SN, 'Equador', F.EC),

  // ==== GRUPO C ====
  mk('groups', 'C', '2026-06-13T16:00:00', 'Brasil', F.BR, 'Croácia', F.HR),
  mk('groups', 'C', '2026-06-14T13:00:00', 'Japão', F.JP, 'Nigéria', F.NG),
  mk('groups', 'C', '2026-06-19T16:00:00', 'Brasil', F.BR, 'Nigéria', F.NG),
  mk('groups', 'C', '2026-06-19T13:00:00', 'Croácia', F.HR, 'Japão', F.JP),
  mk('groups', 'C', '2026-06-25T16:00:00', 'Brasil', F.BR, 'Japão', F.JP),
  mk('groups', 'C', '2026-06-25T16:00:00', 'Nigéria', F.NG, 'Croácia', F.HR),

  // ==== GRUPO D ====
  mk('groups', 'D', '2026-06-14T16:00:00', 'Argentina', F.AR, 'Coreia do Sul', F.KR),
  mk('groups', 'D', '2026-06-15T13:00:00', 'Uruguai', F.UY, 'Gana', F.GH),
  mk('groups', 'D', '2026-06-20T16:00:00', 'Argentina', F.AR, 'Gana', F.GH),
  mk('groups', 'D', '2026-06-20T13:00:00', 'Coreia do Sul', F.KR, 'Uruguai', F.UY),
  mk('groups', 'D', '2026-06-26T16:00:00', 'Argentina', F.AR, 'Uruguai', F.UY),
  mk('groups', 'D', '2026-06-26T16:00:00', 'Gana', F.GH, 'Coreia do Sul', F.KR),

  // ==== GRUPO E ====
  mk('groups', 'E', '2026-06-15T16:00:00', 'França', F.FR, 'Polônia', F.PL),
  mk('groups', 'E', '2026-06-16T13:00:00', 'Dinamarca', F.DK, 'Costa do Marfim', F.CI),
  mk('groups', 'E', '2026-06-21T16:00:00', 'França', F.FR, 'Costa do Marfim', F.CI),
  mk('groups', 'E', '2026-06-21T13:00:00', 'Polônia', F.PL, 'Dinamarca', F.DK),
  mk('groups', 'E', '2026-06-27T16:00:00', 'França', F.FR, 'Dinamarca', F.DK),
  mk('groups', 'E', '2026-06-27T16:00:00', 'Costa do Marfim', F.CI, 'Polônia', F.PL),

  // ==== GRUPO F ====
  mk('groups', 'F', '2026-06-16T16:00:00', 'Espanha', F.ES, 'Sérvia', F.SR),
  mk('groups', 'F', '2026-06-17T13:00:00', 'Holanda', F.NL, 'Austrália', F.AU),
  mk('groups', 'F', '2026-06-22T16:00:00', 'Espanha', F.ES, 'Austrália', F.AU),
  mk('groups', 'F', '2026-06-22T13:00:00', 'Sérvia', F.SR, 'Holanda', F.NL),
  mk('groups', 'F', '2026-06-28T16:00:00', 'Espanha', F.ES, 'Holanda', F.NL),
  mk('groups', 'F', '2026-06-28T16:00:00', 'Austrália', F.AU, 'Sérvia', F.SR),

  // ==== GRUPO G ====
  mk('groups', 'G', '2026-06-17T16:00:00', 'Alemanha', F.DE, 'Áustria', F.AT),
  mk('groups', 'G', '2026-06-18T13:00:00', 'Portugal', F.PT, 'Irã', F.IR),
  mk('groups', 'G', '2026-06-23T13:00:00', 'Alemanha', F.DE, 'Irã', F.IR),
  mk('groups', 'G', '2026-06-23T13:00:00', 'Áustria', F.AT, 'Portugal', F.PT),
  mk('groups', 'G', '2026-06-29T16:00:00', 'Alemanha', F.DE, 'Portugal', F.PT),
  mk('groups', 'G', '2026-06-29T16:00:00', 'Irã', F.IR, 'Áustria', F.AT),

  // ==== GRUPO H ====
  mk('groups', 'H', '2026-06-18T19:00:00', 'Bélgica', F.BE, 'Catar', F.QA),
  mk('groups', 'H', '2026-06-19T19:00:00', 'Itália', F.IT, 'Colômbia', F.CO),
  mk('groups', 'H', '2026-06-24T13:00:00', 'Bélgica', F.BE, 'Colômbia', F.CO),
  mk('groups', 'H', '2026-06-24T13:00:00', 'Catar', F.QA, 'Itália', F.IT),
  mk('groups', 'H', '2026-06-30T16:00:00', 'Bélgica', F.BE, 'Itália', F.IT),
  mk('groups', 'H', '2026-06-30T16:00:00', 'Colômbia', F.CO, 'Catar', F.QA),

  // ==== OITAVAS DE FINAL ====
  mk('r16', undefined, '2026-07-04T13:00:00', '1º Grupo A', '🥇', '2º Grupo B', '🥈'),
  mk('r16', undefined, '2026-07-04T16:00:00', '1º Grupo C', '🥇', '2º Grupo D', '🥈'),
  mk('r16', undefined, '2026-07-05T13:00:00', '1º Grupo E', '🥇', '2º Grupo F', '🥈'),
  mk('r16', undefined, '2026-07-05T16:00:00', '1º Grupo G', '🥇', '2º Grupo H', '🥈'),
  mk('r16', undefined, '2026-07-06T13:00:00', '1º Grupo B', '🥇', '2º Grupo A', '🥈'),
  mk('r16', undefined, '2026-07-06T16:00:00', '1º Grupo D', '🥇', '2º Grupo C', '🥈'),
  mk('r16', undefined, '2026-07-07T13:00:00', '1º Grupo F', '🥇', '2º Grupo E', '🥈'),
  mk('r16', undefined, '2026-07-07T16:00:00', '1º Grupo H', '🥇', '2º Grupo G', '🥈'),

  // ==== QUARTAS DE FINAL ====
  mk('qf', undefined, '2026-07-09T16:00:00', 'Vencedor Oitavas 1', '⚽', 'Vencedor Oitavas 2', '⚽'),
  mk('qf', undefined, '2026-07-10T16:00:00', 'Vencedor Oitavas 3', '⚽', 'Vencedor Oitavas 4', '⚽'),
  mk('qf', undefined, '2026-07-11T16:00:00', 'Vencedor Oitavas 5', '⚽', 'Vencedor Oitavas 6', '⚽'),
  mk('qf', undefined, '2026-07-11T20:00:00', 'Vencedor Oitavas 7', '⚽', 'Vencedor Oitavas 8', '⚽'),

  // ==== SEMIFINAIS ====
  mk('sf', undefined, '2026-07-14T20:00:00', 'Vencedor Quartas 1', '⚽', 'Vencedor Quartas 2', '⚽'),
  mk('sf', undefined, '2026-07-15T20:00:00', 'Vencedor Quartas 3', '⚽', 'Vencedor Quartas 4', '⚽'),

  // ==== TERCEIRO LUGAR ====
  mk('third', undefined, '2026-07-18T16:00:00', 'Perdedor Semi 1', '🥉', 'Perdedor Semi 2', '🥉'),

  // ==== FINAL ====
  mk('final', undefined, '2026-07-19T16:00:00', 'Vencedor Semi 1', '🏆', 'Vencedor Semi 2', '🏆'),
];

export const STAGE_LABELS: Record<Match['stage'], string> = {
  groups: 'Fase de Grupos',
  r32: '32 avos',
  r16: 'Oitavas de Final',
  qf: 'Quartas de Final',
  sf: 'Semifinais',
  third: 'Disputa 3º Lugar',
  final: 'Grande Final',
};
