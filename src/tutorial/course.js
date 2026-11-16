import { GUIDED } from './hands.js';
import { COURSE, LESSONS } from './lessons.js';

/* ================= poker school: the running order ================= */
/* COURSE lists lessons and guided hands by key ('lesson:ranks', 'hand:see'). ITEMS is that list flattened,
   with the title and one-line description each row shows. Progress is stored against the key. */
export const ITEMS = COURSE.flatMap(([part, keys], pi) =>
  keys.map((key) => {
    const [kind, id] = key.split(':');
    const src = kind === 'hand' ? GUIDED[id] : LESSONS.find((l) => l.id === id);
    return { key, kind, id, part: pi, title: src.title, sub: src.sub };
  }),
);
export const itemByKey = (key) => ITEMS.find((it) => it.key === key) || null;
export const itemAfter = (key) => ITEMS[ITEMS.findIndex((it) => it.key === key) + 1] || null;
