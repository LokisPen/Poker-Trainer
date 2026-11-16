import { render } from './router.js';
import { sfx, sfxLast } from './sound.js';
import { APP, LIFE, UI } from './state.js';
import { store } from './storage.js';
import { act } from '../game/engine.js';
import { G } from '../game/state.js';
import { ITEMS } from '../tutorial/course.js';
import { GUIDED, setupGuided } from '../tutorial/hands.js';

/* ================= poker school: flow ================= */
/* Progress through the course, and the runner for the guided hands. A guided hand is an ordinary table whose
   game carries G.tut = {id, i}: which script, and which step of it. Nothing about it is saved or graded. */
const TUT_PACE = 950; // ms between the other players' moves: slow enough for a beginner to follow

export function tutProgress() {
  const done = ITEMS.filter((it) => LIFE.tut.done[it.key]).length;
  return { done, total: ITEMS.length, next: ITEMS.find((it) => !LIFE.tut.done[it.key]) || null };
}
export function markDone(key) {
  if (LIFE.tut.done[key]) return;
  LIFE.tut.done[key] = true;
  store.set('pt3:life', LIFE);
}
/* open a lesson or a guided hand; with nothing to open, go back to the course list */
export function openItem(it) {
  clearTimeout(APP.timer);
  if (it && it.kind === 'hand') {
    startGuided(it.id);
    return;
  }
  if (it) {
    UI.les = { id: it.id, q: {} };
    UI.screen = 'lesson';
  } else UI.screen = 'learn';
  UI.sheet = null;
  render();
  window.scrollTo(0, 0);
}

export function startGuided(id) {
  clearTimeout(APP.timer);
  UI.seen = new Set();
  UI.betSeen = new Set();
  UI.coach = null;
  UI.msgs = [];
  UI.needRebuy = false;
  UI.cache = {};
  UI.sheet = null;
  setupGuided(id);
  UI.screen = 'game';
  sfx('card');
  tutPump();
  window.scrollTo(0, 0);
}
function tutSteps() {
  return GUIDED[G.tut.id].steps;
}
/* draw the current step; if it is another player's move, make it after a pause and go on to the next */
export function tutPump() {
  clearTimeout(APP.timer);
  const H = G.hand,
    steps = tutSteps(),
    st = steps[G.tut.i];
  if (G.tut.i >= steps.length - 1) markDone('hand:' + G.tut.id);
  render();
  if (st && st.bot && !H.done)
    APP.timer = setTimeout(() => {
      if (UI.screen !== 'game' || G.hand !== H || !G.tut) return;
      act(H.toAct, st.bot);
      G.tut.i++;
      sfxLast();
      tutPump();
    }, TUT_PACE);
}
export function tutNext() {
  const steps = tutSteps(),
    st = steps[G.tut.i];
  if (!st || st.bot || st.hero || G.tut.i >= steps.length - 1) return;
  G.tut.i++;
  tutPump();
}
export function tutHero() {
  const st = tutSteps()[G.tut.i],
    H = G.hand;
  if (!st || !st.hero || H.done || H.toAct !== 0) return;
  act(0, st.hero);
  G.tut.i++;
  sfxLast();
  tutPump();
}
