import { UI, money } from '../state.js';
import { ord } from '../../game/session.js';
import { PAYS } from '../../game/state.js';

/* ================= setup ================= */
export const SETUPS = {
  mtt: {
    title: 'Tournament',
    def: { kind: 'mtt', players: 18, seats: 9, buyin: 50, turbo: false, depth: 100, diff: 'normal' },
    fields: [
      [
        'players',
        'Players',
        [
          [9, '9'],
          [18, '18'],
          [27, '27'],
        ],
        'Bigger fields break tables as players bust.',
      ],
      [
        'buyin',
        'Buy-in',
        [
          [20, '$20'],
          [50, '$50'],
          [100, '$100'],
        ],
      ],
      [
        'turbo',
        'Blinds',
        [
          [false, 'Regular'],
          [true, 'Turbo'],
        ],
      ],
      [
        'depth',
        'Starting stack',
        [
          [50, '50 bb'],
          [100, '100 bb'],
        ],
      ],
      [
        'diff',
        'Opponents',
        [
          ['easy', 'Soft'],
          ['normal', 'Mixed'],
          ['hard', 'Tough'],
        ],
      ],
    ],
  },
  sng: {
    title: 'Sit & Go',
    def: { kind: 'sng', players: 9, seats: 9, buyin: 20, turbo: true, depth: 50, diff: 'normal' },
    fields: [
      [
        'seats',
        'Table',
        [
          [2, 'Heads-up'],
          [6, '6-max'],
          [9, '9-handed'],
        ],
        'Heads-up is winner take all. 6-max pays 2 places, 9-handed pays 3.',
      ],
      [
        'buyin',
        'Buy-in',
        [
          [10, '$10'],
          [20, '$20'],
          [50, '$50'],
        ],
      ],
      [
        'turbo',
        'Blinds',
        [
          [true, 'Turbo'],
          [false, 'Regular'],
        ],
      ],
      [
        'depth',
        'Starting stack',
        [
          [50, '50 bb'],
          [100, '100 bb'],
        ],
      ],
      [
        'diff',
        'Opponents',
        [
          ['easy', 'Soft'],
          ['normal', 'Mixed'],
          ['hard', 'Tough'],
        ],
      ],
    ],
  },
  sat: {
    title: 'Satellite',
    def: { kind: 'sat', players: 9, seats: 9, buyin: 20, turbo: true, depth: 50, diff: 'normal', seatsWon: 2 },
    fields: [
      [
        'players',
        'Format',
        [
          [9, '9 players, 2 seats'],
          [18, '18 players, 4 seats'],
        ],
        'Every seat is worth the same, so once you are safe, you should fold almost everything.',
      ],
      [
        'buyin',
        'Buy-in',
        [
          [10, '$10'],
          [20, '$20'],
          [50, '$50'],
        ],
      ],
      [
        'depth',
        'Starting stack',
        [
          [50, '50 bb'],
          [100, '100 bb'],
        ],
      ],
      [
        'diff',
        'Opponents',
        [
          ['easy', 'Soft'],
          ['normal', 'Mixed'],
          ['hard', 'Tough'],
        ],
      ],
    ],
  },
  cash: {
    title: '$1/$3 No-Limit',
    def: { kind: 'cash', buyin: 300, diff: 'normal', rake: true },
    fields: [
      [
        'buyin',
        'Buy-in',
        [
          [100, '$100'],
          [200, '$200'],
          [300, '$300'],
          [500, '$500'],
        ],
        'The table allows $100 to $500.',
      ],
      [
        'diff',
        'Table',
        [
          ['easy', 'Soft (lots of fish)'],
          ['normal', 'Typical'],
          ['hard', 'Reg-heavy'],
        ],
      ],
      [
        'rake',
        'Rake',
        [
          [true, '10% up to $5'],
          [false, 'No rake'],
        ],
      ],
    ],
  },
};
export function setupHTML() {
  const S = SETUPS[UI.setup.k],
    c = UI.setup.c;
  if (c.kind === 'sng') c.players = c.seats;
  if (c.kind === 'sat') c.seatsWon = c.players === 18 ? 4 : 2;
  const f = S.fields
    .map(
      ([key, label, opts, hint]) =>
        `<div class="field"><label>${label}</label><div class="seg">${opts.map(([v, t]) => `<button class="${c[key] === v ? 'on' : ''}" data-act="opt" data-key="${key}" data-v='${JSON.stringify(v)}'>${t}</button>`).join('')}</div>${hint ? `<div class="hint">${hint}</div>` : ''}</div>`,
    )
    .join('');
  let sum = '';
  if (c.kind === 'cash')
    sum = `Blinds $1/$3, nine-handed. You sit with ${money(c.buyin)} (${(c.buyin / 3) | 0} big blinds). Leave whenever you like; your session result is saved.`;
  else {
    const pool = c.buyin * c.players;
    const pays =
      c.kind === 'sat'
        ? new Array(c.seatsWon).fill(pool / c.seatsWon)
        : PAYS[c.kind === 'sng' ? 's' + c.seats : 't' + c.players].map((f) => f * pool);
    sum = `Prize pool ${money(pool)}. ${c.kind === 'sat' ? 'Top ' + c.seatsWon + ' each win a ' + money(pool / c.seatsWon) + ' seat.' : pays.length === 1 ? 'Winner takes it all.' : 'Pays ' + pays.map((p, i) => ord(i + 1) + ' ' + money(p)).join(', ') + '.'} Blinds go up every ${c.turbo ? 6 : 10} hands, with a big-blind ante from level 3.`;
  }
  return `<div class="screen"><div class="top"><button class="link" data-act="goto" data-s="home">‹ Lobby</button></div>
  <h2>${S.title}</h2>${f}<div class="summary">${sum}</div><button class="primary" data-act="start">${c.kind === 'cash' ? 'Take a seat' : 'Shuffle up and deal'}</button></div>`;
}
