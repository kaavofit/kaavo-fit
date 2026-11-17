const KEY = 'kaavo-access-v1';
const HOURS12 = 12 * 60 * 60 * 1000;

type Store = { premium: boolean; unlocks: Record<string, number> };

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      return { premium: !!o.premium, unlocks: o.unlocks || {} };
    }
  } catch {}
  return { premium: false, unlocks: {} };
}

function save(s: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function isPremium() {
  return load().premium;
}

export function setPremium(v: boolean) {
  const s = load();
  s.premium = v;
  save(s);
}

export function unlockExercise(id: string) {
  const s = load();
  s.unlocks[id] = Date.now() + HOURS12;
  save(s);
}

export function unlockLeft(id: string): number {
  const t = load().unlocks[id] || 0;
  return Math.max(0, t - Date.now());
}

export function canUse(tab: string, id: string) {
  if (isPremium()) return true;
  if (tab === 'home') return unlockLeft(id) > 0;
  return false;
}

export function fmtLeft(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h + 'h ' + m + 'm';
}

export function resetAccess() {
  save({ premium: false, unlocks: {} });
}
