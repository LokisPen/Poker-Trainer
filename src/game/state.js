import { pick, rnd, shuffle } from '../core/cards.js';

/* ================= people ================= */
export const STYLES = {
  rock: { label: 'Tight-passive (rock)', loose: 0.6, agg: 0.35, bluff: 0.05, callAdj: -0.04, limp: 0.3 },
  nit: { label: 'Nit', loose: 0.45, agg: 0.5, bluff: 0.03, callAdj: -0.06, limp: 0.1 },
  tag: { label: 'Tight-aggressive', loose: 0.85, agg: 0.75, bluff: 0.18, callAdj: 0, limp: 0 },
  reg: { label: 'Solid regular', loose: 1.0, agg: 0.65, bluff: 0.2, callAdj: 0, limp: 0 },
  lag: { label: 'Loose-aggressive', loose: 1.45, agg: 0.8, bluff: 0.3, callAdj: 0.02, limp: 0 },
  station: { label: 'Calling station', loose: 1.8, agg: 0.2, bluff: 0.05, callAdj: 0.14, limp: 0.7 },
  whale: { label: 'Loose-passive whale', loose: 2.5, agg: 0.25, bluff: 0.1, callAdj: 0.18, limp: 0.85 },
  maniac: { label: 'Maniac', loose: 2.2, agg: 0.9, bluff: 0.45, callAdj: 0.06, limp: 0.1 },
};
export const STYLE_MIX = {
  tour: {
    easy: ['rock', 'station', 'station', 'whale', 'maniac', 'nit', 'rock', 'lag', 'tag'],
    normal: ['rock', 'tag', 'lag', 'station', 'maniac', 'reg', 'nit', 'reg', 'station'],
    hard: ['reg', 'reg', 'tag', 'lag', 'tag', 'reg', 'nit', 'lag', 'maniac'],
  },
  cash: {
    easy: ['whale', 'station', 'station', 'rock', 'whale', 'maniac', 'nit', 'station'],
    normal: ['station', 'whale', 'rock', 'reg', 'tag', 'nit', 'station', 'maniac', 'lag'],
    hard: ['reg', 'tag', 'lag', 'reg', 'station', 'nit', 'tag', 'maniac'],
  },
};
export const NOISE = { easy: 0.14, normal: 0.06, hard: 0.02 };
export const NAMES =
  'Marisol Dutch Keanu Rosa Teddy Ines Bo Priya Gus Lupe Hank Nadia Earl Yuki Duke Carmen Lou Sven Bianca Otis Mae Rafa Wes Dolores Ike Greta Sal Noor Jojo Pearl Ruben Tex Mina Abe Leni Cruz Vic Ada Moe Fern Tito Opal Rudy Ivy Nico Bette Lalo Hazel Cy Zora'.split(
    ' ',
  );
let PID = 1;
export function setPID(n) {
  PID = n;
}
export function newBot(style, stack, used) {
  let nm;
  do nm = pick(NAMES);
  while (used && used.has(nm));
  if (used) used.add(nm);
  return { id: PID++, name: nm, style, stack, hero: false, st: newStats() };
}
const newStats = () => ({ h: 0, v: 0, p: 0, agB: 0, agC: 0, sd: 0 });

/* ================= structure ================= */
export const LEVELS = [
  [25, 50],
  [50, 100],
  [75, 150],
  [100, 200],
  [150, 300],
  [200, 400],
  [300, 600],
  [400, 800],
  [500, 1000],
  [700, 1400],
  [1000, 2000],
  [1500, 3000],
  [2000, 4000],
  [3000, 6000],
  [4000, 8000],
  [6000, 12000],
  [8000, 16000],
  [10000, 20000],
  [15000, 30000],
  [20000, 40000],
  [30000, 60000],
  [40000, 80000],
  [60000, 120000],
];
export const PAYS = {
  t9: [0.5, 0.3, 0.2],
  t18: [0.4, 0.27, 0.19, 0.14],
  t27: [0.36, 0.24, 0.17, 0.13, 0.1],
  s2: [1],
  s6: [0.65, 0.35],
  s9: [0.5, 0.3, 0.2],
};
const POS_NAMES = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'];
export const OPEN = { UTG: 0.1, 'UTG+1': 0.12, MP: 0.14, LJ: 0.17, HJ: 0.21, CO: 0.28, BTN: 0.42, SB: 0.34, BB: 0.5 };
/* how wide a seat opens right now: heads-up the button is also the small blind and plays most hands */
export function openPct(pn) {
  const n = G && G.hand ? G.hand.order.length : 9;
  if (n === 2 && pn === 'BTN') return 0.8;
  if (n === 3 && pn === 'BTN') return 0.5;
  if (n === 3 && pn === 'SB') return 0.42;
  return OPEN[pn] || 0.2;
}

/* ================= game setup ================= */
export let G = null;
/* the one live game; other modules read G and replace it through setG (undo, resume) */
export function setG(g) {
  G = g;
}
export function makeTour(cfg) {
  // cfg:{kind:'mtt'|'sng'|'sat', players, seats, buyin, turbo, depth, diff, seatsWon}
  PID = 1;
  const used = new Set(['You']);
  const start = cfg.depth * 50;
  const mix = STYLE_MIX.tour[cfg.diff];
  const all = [];
  for (let i = 0; i < cfg.players - 1; i++) all.push(newBot(mix[i % mix.length], start, used));
  shuffle(all);
  const hero = { id: 0, name: 'You', style: 'hero', stack: start, hero: true, st: newStats() };
  const seats = new Array(cfg.seats).fill(null);
  seats[0] = hero;
  const atTable = Math.min(cfg.seats, cfg.players);
  const tables = Math.ceil(cfg.players / cfg.seats);
  const tgt = Math.ceil(cfg.players / tables);
  for (let i = 1; i < Math.min(atTable, tgt); i++) seats[i] = all.pop();
  const pool = all;
  const pool$ = cfg.buyin * cfg.players;
  let pays;
  if (cfg.kind === 'sat') {
    pays = new Array(cfg.seatsWon).fill(Math.round(pool$ / cfg.seatsWon));
  } else {
    const key = cfg.kind === 'sng' ? 's' + cfg.seats : 't' + cfg.players;
    pays = PAYS[key].map((f) => Math.round(f * pool$));
  }
  G = {
    mode: 'tour',
    cfg,
    seats,
    pool,
    button: rnd(cfg.seats),
    level: 0,
    handsAtLevel: 0,
    handNo: 0,
    hand: null,
    finished: [],
    pays,
    prizePool: pool$,
    records: [],
    over: false,
    cast: seats.filter((p) => p && !p.hero).map((p) => ({ name: p.name, style: p.style })),
    heroPlace: 0,
    heroPrize: 0,
    log: [],
    undo: null,
    grades: [],
    startStack: start,
    notice: '',
  };
  while (!G.seats[G.button]) G.button = (G.button + 1) % cfg.seats;
  return G;
}
export function makeCash(cfg) {
  // cfg:{buyin, diff, rake}
  PID = 1;
  const used = new Set(['You']);
  const mix = shuffle(STYLE_MIX.cash[cfg.diff].slice());
  const seats = new Array(9).fill(null);
  seats[0] = { id: 0, name: 'You', style: 'hero', stack: cfg.buyin, hero: true, st: newStats() };
  for (let i = 1; i < 9; i++)
    seats[i] = newBot(mix[(i - 1) % mix.length], pick([150, 200, 300, 300, 300, 400, 500]), used);
  G = {
    mode: 'cash',
    cfg,
    seats,
    pool: [],
    button: rnd(9),
    cast: seats.filter((p) => p && !p.hero).map((p) => ({ name: p.name, style: p.style })),
    handNo: 0,
    hand: null,
    records: [],
    log: [],
    undo: null,
    grades: [],
    session: { invested: cfg.buyin, hands: 0, rake: 0, peak: cfg.buyin, low: cfg.buyin },
    sb: 1,
    bb: 3,
    over: false,
    notice: '',
    used: [...used],
  };
  return G;
}
export const unit = () => (G.mode === 'cash' ? 1 : 25);
export function blinds() {
  if (G.mode === 'cash') return { sb: 1, bb: 3, ante: 0 };
  const L = LEVELS[Math.min(G.level, LEVELS.length - 1)];
  return { sb: L[0], bb: L[1], ante: G.level >= 2 ? L[1] : 0 };
}
export const handsPerLevel = () => (G.cfg.turbo ? 6 : 10);
export function nextOcc(i) {
  const n = G.seats.length;
  for (let k = 1; k <= n; k++) {
    const j = (i + k) % n;
    const p = G.seats[j];
    if (p && p.stack > 0) return j;
  }
  return -1;
}
export function activeSeats() {
  return G.seats.map((p, i) => (p && p.stack > 0 ? i : -1)).filter((i) => i >= 0);
}
export function posName(seat) {
  const H = G.hand,
    order = H.order,
    n = order.length,
    k = order.indexOf(seat);
  if (n === 2) return k === 0 ? 'BTN' : 'BB';
  if (k === 0) return 'BTN';
  if (k === 1) return 'SB';
  if (k === 2) return 'BB';
  const early = POS_NAMES.slice(POS_NAMES.length - (n - 3));
  return early[k - 3];
}
/* posName sets the range a seat plays, which depends on how many players are behind it.
   posLabel is what the seat is called at the table: whoever acts first preflop is under the gun, however short-handed. */
export function posLabel(seat) {
  const H = G.hand;
  return H.order.length >= 4 && H.order.indexOf(seat) === 3 ? 'UTG' : posName(seat);
}
