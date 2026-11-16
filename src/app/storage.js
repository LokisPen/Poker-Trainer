import { clone } from '../core/cards.js';

/* ================= storage ================= */
/* Stats and the game in progress are saved to the viewer's private store on this page, so they follow them
   between devices. Where that store can't be reached (signed out, a saved copy, a view-only share) they stay in this browser. */
const MEM = {};
const LS = {
  get(k) {
    try {
      const v = localStorage.getItem(k);
      if (v) return JSON.parse(v);
    } catch (e) {}
    return MEM[k] ?? null;
  },
  set(k, v) {
    MEM[k] = v;
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
  del(k) {
    delete MEM[k];
    try {
      localStorage.removeItem(k);
    } catch (e) {}
  },
};
export let ACCT = null;
const acctReady = (async () => {
  try {
    const c = window.claude;
    if (!c || !c.use) return;
    const [db, user] = await Promise.all([c.use('db'), c.use('user')]);
    if (!db || !user) return;
    const id = await user.id();
    if (id) ACCT = db.collection('data/users/' + id);
  } catch (e) {}
})();
const within = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
export let bootDone;
const booted = new Promise((r) => {
  bootDone = r;
}); // nothing is written until saved data has been read, so a fresh page can't overwrite it
export const PEND = {},
  BUSY = {};
async function pushDoc(k) {
  if (BUSY[k]) return;
  BUSY[k] = true;
  await booted;
  while (k in PEND) {
    const body = PEND[k];
    delete PEND[k];
    if (ACCT) {
      const ref = ACCT.doc(k),
        write = () => (body === null ? ref.delete() : ref.set(body));
      try {
        await write();
        continue;
      } catch (e) {
        let err = e;
        if (e && e.code === 'unavailable') {
          await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
          try {
            await write();
            continue;
          } catch (e2) {
            err = e2;
          }
        }
        if (
          /invalid_argument|revoked|not_granted|capability_|transform_error|quota_exceeded/.test(
            (err && err.code) || '',
          )
        )
          ACCT = null;
        else {
          LS.set(k, body);
          continue;
        } // a passing hiccup: the next save sends the whole document again
      }
    }
    if (body === null) LS.del(k);
    else LS.set(k, body);
  }
  BUSY[k] = false;
}
export const store = {
  async get(k) {
    await acctReady;
    if (ACCT) {
      try {
        const s = await within(ACCT.doc(k).get(), 10000);
        return s.exists ? clone(s.data()) : LS.get(k);
      } catch (e) {
        ACCT = null;
      }
    }
    return LS.get(k);
  },
  set(k, v) {
    PEND[k] = clone(v);
    pushDoc(k);
  },
  del(k) {
    LS.del(k);
    PEND[k] = null;
    pushDoc(k);
  },
};
