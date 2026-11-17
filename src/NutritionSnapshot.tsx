import { useEffect, useState } from 'react';

/* ------------------------------------------------------------------
   NUTRITION SNAPSHOT + MEAL LOG
   - Meals are logged from the Diet plans (button "Log this meal").
   - Everything is saved in this phone's browser (localStorage), per day.
   - One entry per meal slot per day. Logging the same slot again replaces it.
------------------------------------------------------------------- */

// ==LOG-START==
const KEY = 'kaavo-meals-v1';
export const MEALS_EVENT = 'kaavo-meals-changed';

export type Entry = { kcal: number; p: number; c: number; f: number; diet: string };
export type PlanInfo = { name: string; kcal: number; p: number };
type Store = { days: Record<string, Record<string, Entry>>; plan: PlanInfo | null };

function dayKey(): string {
  const n = new Date();
  const m = n.getMonth() + 1;
  const d = n.getDate();
  return n.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      return { days: o.days || {}, plan: o.plan || null };
    }
  } catch {}
  return { days: {}, plan: null };
}

function save(s: Store) {
  try {
    const keys = Object.keys(s.days).sort();
    while (keys.length > 60) {
      const k = keys.shift();
      if (k) delete s.days[k];
    }
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
  try {
    window.dispatchEvent(new Event(MEALS_EVENT));
  } catch {}
}

export function getToday(): { entries: Record<string, Entry>; plan: PlanInfo | null } {
  const s = load();
  return { entries: s.days[dayKey()] || {}, plan: s.plan };
}

export function logMeal(slot: string, entry: Entry, plan: PlanInfo) {
  const s = load();
  const k = dayKey();
  if (!s.days[k]) s.days[k] = {};
  s.days[k][slot] = entry;
  s.plan = plan;
  save(s);
}

export function unlogMeal(slot: string) {
  const s = load();
  const k = dayKey();
  if (s.days[k]) delete s.days[k][slot];
  save(s);
}

export function clearToday() {
  const s = load();
  delete s.days[dayKey()];
  save(s);
}

export function totalsOf(entries: Record<string, Entry>) {
  let kcal = 0, p = 0, c = 0, f = 0, n = 0;
  Object.keys(entries).forEach((k) => {
    const e = entries[k];
    kcal += e.kcal;
    p += e.p;
    c += e.c;
    f += e.f;
    n += 1;
  });
  return { kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), f: Math.round(f), n };
}
// ==LOG-END==

export function useToday() {
  const [, setT] = useState(0);
  useEffect(() => {
    const h = () => setT((x) => x + 1);
    window.addEventListener(MEALS_EVENT, h);
    return () => window.removeEventListener(MEALS_EVENT, h);
  }, []);
  return getToday();
}

const C = {
  card: '#223a2f',
  inner: '#1b3027',
  line: '#2e4b3d',
  gold: '#cdaa4e',
  mint: '#8fd6b4',
  text: '#ffffff',
  sub: '#a9bfb3',
};

export default function NutritionSnapshot() {
  const today = useToday();
  const t = totalsOf(today.entries);
  const plan = today.plan;
  const goal = Math.max(4, t.n);

  const tile = (title: string, big: string, small: string) => (
    <div style={{ flex: 1, minWidth: 0, background: C.inner, borderRadius: 18, padding: '14px 12px' }}>
      <div style={{ color: C.sub, fontSize: 13 }}>{title}</div>
      <div style={{ color: C.text, fontSize: 26, fontWeight: 800, margin: '10px 0 8px' }}>{big}</div>
      <div style={{ color: C.sub, fontSize: 12 }}>{small}</div>
    </div>
  );

  return (
    <div style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: 28, padding: 20, margin: '4px 0 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ color: C.gold, fontSize: 14, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>Daily overview</div>
          <div style={{ color: C.text, fontSize: 22, fontWeight: 800, margin: '10px 0 14px' }}>Nutrition snapshot</div>
        </div>
        {t.n > 0 && (
          <button
            onClick={clearToday}
            style={{ flex: '0 0 auto', background: 'transparent', border: '1px solid ' + C.line, color: C.sub, borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 700 }}
          >
            Clear today
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {tile('Calories', t.n > 0 ? String(t.kcal) : '—', plan ? 'of ' + plan.kcal + ' kcal' : 'Pick a diet plan')}
        {tile('Protein', t.n > 0 ? t.p + ' g' : '—', plan ? 'of ' + plan.p + ' g' : 'Pick a diet plan')}
        {tile('Meals', t.n + ' / ' + goal, t.n > 0 ? 'Logged today' : 'Log meals')}
      </div>
    </div>
  );
}
