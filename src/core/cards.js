/* ================= core: cards, evaluator, ranges ================= */
export const R13 = '23456789TJQKA';
export let RNG = Math.random;
/* tests swap in a seeded generator */
export function setRNG(f) {
  RNG = f || Math.random;
}
export const rnd = (n) => Math.floor(RNG() * n);
export const pick = (a) => a[rnd(a.length)];
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const newDeck = () => shuffle([...Array(52).keys()]);
export const clone = (o) => JSON.parse(JSON.stringify(o));
/* a card is 0..51: rank*4+suit, suits in the order spades, hearts, diamonds, clubs. cardOf('As') reads the usual shorthand */
export const cardOf = (s) => R13.indexOf(s[0]) * 4 + 'shdc'.indexOf(s[1]);

function straightHigh(m) {
  for (let r = 12; r >= 4; r--) {
    if (((m >> (r - 4)) & 31) === 31) return r;
  }
  if ((m & 0x100f) === 0x100f) return 3;
  return -1;
}
export function eval7(cs) {
  const rc = new Array(13).fill(0),
    sc = [0, 0, 0, 0],
    sm = [0, 0, 0, 0];
  let m = 0;
  for (const c of cs) {
    const r = c >> 2,
      s = c & 3;
    rc[r]++;
    sc[s]++;
    sm[s] |= 1 << r;
    m |= 1 << r;
  }
  const s5 = (cat, k) => {
    let v = cat;
    for (let i = 0; i < 5; i++) v = v * 13 + (k[i] > 0 ? k[i] : 0);
    return v;
  };
  for (let s = 0; s < 4; s++)
    if (sc[s] >= 5) {
      const h = straightHigh(sm[s]);
      if (h >= 0) return s5(8, [h]);
    }
  let q = -1;
  const tr = [],
    pr = [],
    sg = [];
  for (let r = 12; r >= 0; r--) {
    const n = rc[r];
    if (n === 4) q = r;
    else if (n === 3) tr.push(r);
    else if (n === 2) pr.push(r);
    else if (n === 1) sg.push(r);
  }
  if (q >= 0) {
    let k = -1;
    for (let r = 12; r >= 0; r--)
      if (r !== q && rc[r]) {
        k = r;
        break;
      }
    return s5(7, [q, k]);
  }
  if (tr.length && (tr.length > 1 || pr.length)) {
    const p = Math.max(tr[1] ?? -1, pr[0] ?? -1);
    return s5(6, [tr[0], p]);
  }
  for (let s = 0; s < 4; s++)
    if (sc[s] >= 5) {
      const k = [];
      for (let r = 12; r >= 0 && k.length < 5; r--) if ((sm[s] >> r) & 1) k.push(r);
      return s5(5, k);
    }
  const sh = straightHigh(m);
  if (sh >= 0) return s5(4, [sh]);
  if (tr.length) {
    const k = [];
    for (let r = 12; r >= 0 && k.length < 2; r--) if (rc[r] && r !== tr[0]) k.push(r);
    return s5(3, [tr[0], ...k]);
  }
  if (pr.length >= 2) {
    let k = -1;
    for (let r = 12; r >= 0; r--)
      if (rc[r] && r !== pr[0] && r !== pr[1]) {
        k = r;
        break;
      }
    return s5(2, [pr[0], pr[1], k]);
  }
  if (pr.length) {
    const k = [];
    for (let r = 12; r >= 0 && k.length < 3; r--) if (rc[r] && r !== pr[0]) k.push(r);
    return s5(1, [pr[0], ...k]);
  }
  return s5(0, sg.slice(0, 5));
}
const P5 = 13 ** 5;
export function best5(cs) {
  const v = eval7(cs),
    n = cs.length;
  if (n <= 5) return cs.slice();
  for (let a = 0; a < n; a++)
    for (let b = a + 1; b < n; b++) {
      const sub = cs.filter((_, i) => i !== a && i !== b);
      if (sub.length === 5 && eval7(sub) === v) return sub;
    }
  if (n === 6)
    for (let a = 0; a < n; a++) {
      const sub = cs.filter((_, i) => i !== a);
      if (eval7(sub) === v) return sub;
    }
  return cs.slice();
}
export const catOf = (v) => Math.floor(v / P5);
export const RN = [
  'Twos',
  'Threes',
  'Fours',
  'Fives',
  'Sixes',
  'Sevens',
  'Eights',
  'Nines',
  'Tens',
  'Jacks',
  'Queens',
  'Kings',
  'Aces',
];
export const RN1 = [
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Jack',
  'Queen',
  'King',
  'Ace',
];
export function handName(v) {
  const c = catOf(v),
    k = Math.floor(v / 13 ** 4) % 13,
    k2 = Math.floor(v / 13 ** 3) % 13;
  return [
    'High card, ' + RN1[k],
    'Pair of ' + RN[k],
    'Two pair, ' + RN[k] + ' and ' + RN[k2],
    'Three ' + RN[k],
    RN1[k] + '-high straight',
    'Flush, ' + RN1[k] + '-high',
    'Full house, ' + RN[k] + ' full of ' + RN[k2],
    'Four ' + RN[k],
    k === 12 ? 'Royal flush' : 'Straight flush',
  ][c];
}

export const ORDER =
  'AA KK QQ JJ TT 99 88 AKs AQs 77 AJs AKo KQs 66 ATs AQo KJs A9s AJo KTs A8s QJs KQo 55 A7s ATo K9s 44 A5s 22 QTs 33 A9o KJo A6s A4s A8o JTs KTo K8s QJo A3s K7s A7o Q9s A2s A5o K9o K6s QTo A6o J9s Q8s A4o K5s T9s JTo K4s A3o Q7s K8o J8s A2o K3s K7o Q9o Q6s J9o T8s K6o K2s J7s Q8o Q5s K5o Q4s 98s T9o Q3s K4o J6s Q7o T7s J8o K3o Q2s J5s 97s Q6o 87s J4s K2o Q5o T8o J7o T6s J3s Q4o 98o J2s T7o 96s T5s Q3o T4s 86s J6o 76s J5o T3s Q2o 97o 95s J4o 65s T2s 87o T6o 94s 85s J3o 75s J2o 96o 93s T5o 54s T4o 84s 92s 86o 64s 76o 74s 95o T3o 83s T2o 73s 53s 85o 82s 75o 65o 63s 94o 43s 93o 84o 54o 72s 42s 52s 92o 64o 32s 74o 62s 83o 73o 82o 53o 63o 43o 72o 52o 62o 42o 32o'.split(
    ' ',
  );
export const CI = {};
ORDER.forEach((n, i) => (CI[n] = i));
export const comboN = (n) => (n.length === 2 ? 6 : n[2] === 's' ? 4 : 12);
export const CUM = [];
{
  let a = 0;
  ORDER.forEach((n, i) => {
    a += comboN(n);
    CUM[i] = a / 1326;
  });
}
export const startPct = (i) => (i ? CUM[i - 1] : 0);
export function handClass(h) {
  const a = Math.max(h[0] >> 2, h[1] >> 2),
    b = Math.min(h[0] >> 2, h[1] >> 2);
  if (a === b) return R13[a] + R13[b];
  return R13[a] + R13[b] + ((h[0] & 3) === (h[1] & 3) ? 's' : 'o');
}
export const handPct = (h) => CUM[CI[handClass(h)]];
export const COMBOS = [];
ORDER.forEach((n) => {
  const a = R13.indexOf(n[0]),
    b = R13.indexOf(n[1]);
  if (n.length === 2) {
    for (let s = 0; s < 4; s++) for (let t = s + 1; t < 4; t++) COMBOS.push([a * 4 + s, b * 4 + t]);
  } else if (n[2] === 's') {
    for (let s = 0; s < 4; s++) COMBOS.push([a * 4 + s, b * 4 + s]);
  } else {
    for (let s = 0; s < 4; s++) for (let t = 0; t < 4; t++) if (s !== t) COMBOS.push([a * 4 + s, b * 4 + t]);
  }
});
function sampleRange(r, dead) {
  const lo = Math.min(1325, Math.floor(clamp(r.lo || 0, 0, 1) * 1326)),
    hi = clamp(Math.ceil(clamp(r.hi, 0, 1) * 1326), lo + 1, 1326);
  for (let t = 0; t < 60; t++) {
    const c = COMBOS[lo + rnd(hi - lo)];
    if (!dead.has(c[0]) && !dead.has(c[1])) return c;
  }
  for (let t = 0; t < 400; t++) {
    const c = COMBOS[rnd(1326)];
    if (!dead.has(c[0]) && !dead.has(c[1])) return c;
  }
  return null;
}
/* made-hand / draw helpers */
function boardOnlyScore(b) {
  if (b.length >= 5) return eval7(b);
  /* partial board: rank-only */ const rc = {};
  let mx = 0;
  for (const c of b) {
    rc[c >> 2] = (rc[c >> 2] || 0) + 1;
    mx = Math.max(mx, rc[c >> 2]);
  }
  return (mx >= 3 ? 3 : mx === 2 ? (Object.values(rc).filter((x) => x === 2).length > 1 ? 2 : 1) : 0) * P5;
}
export function drawInfo(h, board) {
  if (board.length >= 5) return { fd: false, sd: false };
  const all = [...h, ...board],
    sc = [0, 0, 0, 0],
    hs = [0, 0, 0, 0];
  for (const c of all) sc[c & 3]++;
  for (const c of h) hs[c & 3]++;
  let fd = false;
  for (let s = 0; s < 4; s++) if (sc[s] === 4 && hs[s] > 0) fd = true;
  let m = 0;
  for (const c of all) m |= 1 << (c >> 2);
  if ((m >> 12) & 1) m |= 1 << 13;
  let hm = 0;
  for (const c of h) {
    hm |= 1 << (c >> 2);
    if (c >> 2 === 12) hm |= 1 << 13;
  }
  let sd = false;
  for (let lo = 0; lo <= 9; lo++) {
    const w = (m >> lo) & 31;
    let bits = 0;
    for (let k = 0; k < 5; k++) if ((w >> k) & 1) bits++;
    if (bits === 4 && (hm >> lo) & 31 & w) sd = true;
  }
  return { fd, sd };
}
export function strengthCond(kind, pBluff) {
  return (h, board) => {
    if (!board.length) return true;
    const v = eval7([...h, ...board]),
      bc = catOf(boardOnlyScore(board)),
      c = catOf(v);
    if (kind === 'raise') {
      if (c >= 2 && c > bc) return true;
      const d = drawInfo(h, board);
      if (d.fd && d.sd) return true;
      return RNG() < pBluff * 0.5;
    }
    if (c > bc) return true;
    const d = drawInfo(h, board);
    if (d.fd || d.sd) return RNG() < 0.75;
    return RNG() < pBluff;
  };
}
export function equity(hole, board, ranges, iters) {
  iters = iters || 500;
  let win = 0,
    n = 0;
  for (let it = 0; it < iters; it++) {
    const dead = new Set([...hole, ...board]);
    const vs = [];
    let ok = true;
    for (const r of ranges) {
      let h = null;
      for (let k = 0; k < 14; k++) {
        h = sampleRange(r, dead);
        if (!h) break;
        if (!r.cond || r.cond(h, board)) break;
      }
      if (!h) {
        ok = false;
        break;
      }
      dead.add(h[0]);
      dead.add(h[1]);
      vs.push(h);
    }
    if (!ok) continue;
    const bd = board.slice();
    while (bd.length < 5) {
      const c = rnd(52);
      if (!dead.has(c)) {
        dead.add(c);
        bd.push(c);
      }
    }
    const hv = eval7([...hole, ...bd]);
    let ties = 0,
      lose = false;
    for (const v of vs) {
      const x = eval7([...v, ...bd]);
      if (x > hv) {
        lose = true;
        break;
      }
      if (x === hv) ties++;
    }
    n++;
    if (!lose) win += 1 / (ties + 1);
  }
  return n ? win / n : 0;
}
const EQG = [0.02, 0.04, 0.07, 0.1, 0.14, 0.2, 0.27, 0.35, 0.45, 0.6, 0.8, 1];
const EQT =
  '808183858685868585848485,627173727476777880818383,456264666869707374777881,305557596264676869727675,194752545861646566697475,193648525458606262666972,202642455254545960626570,384653586064656768666867,374043515659636463646866,192540424851535658596367,323839445157596063636666,354149555762646666656566,313737414649515258596164,202435424448525353586163,293637404651575963626466,303641495456616162646365,283638394245485155596162,273335404348535657606163,283337424954585859626665,263437394043454852596060,293133384047505357596061,253538394042464551545861,293534374046504955595961,202432404348495454545760,303134353843495055565862,263436394550555858596462,273235363740414752565858,202435374044475252535558,313132363745475053565760,172431374143434547505050,233434373838404649525760,202432384144454750505153,252832354046505455576062,243435363842474953575960,313131344042475253555960,313332373844465151555658,253031333845485153576059,213237373938424248495557,203231353640424851555859,262932343738414449545659,243433323637414446515558,303134363743484951545658,262933323538404148525458,262730343541455051565860,233032353538384148515457,293230374044454950545756,263028333641444849515457,212831323335394349525658,252931333435394247495457,203132333437394344505560,272628323539444751545558,213034353738384144495256,233032333435374045505355,272729323640444450525355,252830343435394245495357,213236373537404143455055,173133333534383942495256,252931333437404046505154,272828313639414549515455,212831323535363741475155,202727313332394045515456,212733333735373941455053,262627323439414549475455,242830333234374243475154,222627303234373944505254,192831323333353943485456,232729323236353840455152,162832333336373738444953,202733343438373740454853,222528313232363642485255,232929313435384142455254,192830323336373739444852,192630303231343740475255,212931323335373742425055,222427313133353741485153,232730323236373839434853,202533353738403940414551,162731323335373938404752,212531323234363739444751,222327293031343739445053,172529303334363737404650,172226282932333639435051,202532333535373939424650,162427293232353638434751,212526283233343839444952,182629313135333740424849,182629303233353839404549,212433333536364038414450,182327283132313537404652,212533323838373839414147,182630313334353637404450,202527292932333738454852,172226283030313536404650,162530303033353738404651,162329293031343536404549,172428313235363738394449,182530303232343537394548,182224272932303236404648,172429313435353636394348,172529303232343536394347,152128303231323635394348,192331323536373739394248,162329313234363636394349,172225283030323336384350,152529303132343635384245,212531323537353841384147,142226272730313236374348,222529323537383839404244,152126252831303235374248,162129283232353336374145,162327282730323336384347,172227313234313636394145,182428313334373536384046,152127272931303233374145,232429323337353938394043,162228303033333435353946,182229303134363636374145,152226272930323435384246,162128293132343635384043,192229323434353738394144,132125262728303033354145,222229303435373738403942,132124272829303232364045,142026303131333334363843,162229273033333535363943,122026262729323233354143,212428323337363939384041,122024262730303232343841,182229293334343535383841,152128313033343435353843,162026283333333535363843,212230303334363837384043,172027293133353534363844,212228313333353736383842,142025273028323134343843,122025272829293130343743,161926293231323434363841,121923262728293030333742,182026303133333436383840,212228303334363737373840,142027302932323334353642,151926273131343434353740,171825293032323632353738,172126283333343436363839,192128303333333436373839,111824272629283133323641,212328303235343536383738,131825252728302932323442,151825272930313231323539,182125293031323435353640,171825293131323231343538,162026293032343536353636,192228313235333436363737,121823272729313031333539,181926263030323334343638,192126303132353434343338,171925283130323533343538,162025293033343232333637,131623252727292830313436,131622262829313130323334,121522252828293030303339,182026273031323331343437,161924252929323233323334,161923273030313234343534,121521242528302830293035,161722262830312931303333,121623252929313131323134,151722242728313131323234,151722242828303031313033'
    .split(',')
    .map((r) => {
      const a = [];
      for (let i = 0; i < r.length; i += 2) a.push(+r.slice(i, i + 2) / 100);
      return a;
    });
export function eqVs(ci, p) {
  p = clamp(p, 0.02, 1);
  let j = 0;
  while (j < EQG.length - 1 && EQG[j + 1] < p) j++;
  if (j >= EQG.length - 1) return EQT[ci][EQG.length - 1];
  const t = (p - EQG[j]) / (EQG[j + 1] - EQG[j]);
  return EQT[ci][j] * (1 - t) + EQT[ci][j + 1] * t;
}
const PUSH_A = [0, 0.62, 0.42, 0.31, 0.25, 0.21, 0.18, 0.16, 0.14, 0.13];
export function pushPct(bb, behind, ante) {
  return clamp(PUSH_A[clamp(behind, 1, 9)] * Math.pow(10 / Math.max(bb, 1), 0.85) * (ante ? 1.12 : 1), 0.02, 1);
}
export function callPct(shoverP, need) {
  let f = 0;
  for (let i = 0; i < 169; i++) if (eqVs(i, shoverP) >= need) f += comboN(ORDER[i]) / 1326;
  return clamp(f, 0.005, 1);
}

export function boardWet(b) {
  const s = [0, 0, 0, 0];
  b.forEach((c) => s[c & 3]++);
  const r = b.map((c) => c >> 2).sort((x, y) => x - y);
  let conn = 0;
  for (let i = 1; i < r.length; i++) if (r[i] - r[i - 1] > 0 && r[i] - r[i - 1] <= 2) conn++;
  return (Math.max(...s) >= 2 && conn >= 1) || conn >= 2 || Math.max(...s) >= 3;
}
export function boardDry(b) {
  const s = [0, 0, 0, 0];
  b.forEach((c) => s[c & 3]++);
  const r = b.map((c) => c >> 2).sort((x, y) => y - x);
  let conn = 0;
  for (let i = 1; i < r.length; i++) if (r[i - 1] - r[i] > 0 && r[i - 1] - r[i] <= 2) conn++;
  return (Math.max(...s) <= 2 && conn === 0 && r[0] >= 9) || (new Set(r).size < r.length && Math.max(...s) <= 2);
}
