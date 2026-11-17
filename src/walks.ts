/* Walk tracking core: types, local storage, GPS filtering, calories, formatting.
   Pure functions (no React) so the logic can be tested on its own. */

export type Pt = {lat: number; lng: number; t: number; acc?: number; b?: 1};
export type Walk = {
  id: string;
  start: number;
  end: number;
  durationSec: number;
  distanceM: number;
  kcal: number;
  weightKg: number;
  route: Pt[];
};
export type Session = {
  state: 'running' | 'paused';
  startedAt: number;
  accumMs: number;
  segStart: number | null;
  distanceM: number;
  route: Pt[];
  lastFix: Pt | null;
  pendingBreak: boolean;
  updatedAt: number;
};
export type Fix = {lat: number; lng: number; t: number; acc: number};

export const MAX_ACC_M = 35;        // ignore fixes less accurate than this
export const MAX_SPEED_MS = 10;     // ignore GPS jumps faster than 36 km/h
export const MIN_SAVE_SEC = 10;     // walks shorter than this are not saved
export const MAX_WALKS = 200;
export const MAX_ROUTE_PTS = 500;
export const DAILY_GOAL_MIN = 30;
export const DEFAULT_WEIGHT_KG = 70;

/* ---------- storage ---------- */
const K_WALKS = 'kf-walks';
const K_ACTIVE = 'kf-walk-active';
const K_WEIGHT = 'kf-walk-weight';

const get = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string): boolean => { try { localStorage.setItem(k, v); return true; } catch { return false; } };
const del = (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

const num = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const isPt = (p: any): p is Pt => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Number.isFinite(p.t);

export const loadWalks = (): Walk[] => {
  try {
    const v = JSON.parse(get(K_WALKS) || '[]');
    if (!Array.isArray(v)) return [];
    return v
      .filter(w => w && typeof w.id === 'string' && Number.isFinite(w.start))
      .map((w): Walk => ({
        id: w.id, start: num(w.start), end: num(w.end, num(w.start)),
        durationSec: Math.max(0, num(w.durationSec)), distanceM: Math.max(0, num(w.distanceM)),
        kcal: Math.max(0, num(w.kcal)), weightKg: num(w.weightKg, DEFAULT_WEIGHT_KG),
        route: Array.isArray(w.route) ? w.route.filter(isPt) : []
      }))
      .sort((a, b) => b.start - a.start);
  } catch { return []; }
};
export const saveWalks = (w: Walk[]): boolean => set(K_WALKS, JSON.stringify(w.slice(0, MAX_WALKS)));

export const loadActive = (): Session | null => {
  try {
    const s = JSON.parse(get(K_ACTIVE) || 'null');
    if (!s || (s.state !== 'running' && s.state !== 'paused')) return null;
    return {
      state: s.state, startedAt: num(s.startedAt), accumMs: Math.max(0, num(s.accumMs)),
      segStart: s.segStart == null ? null : num(s.segStart), distanceM: Math.max(0, num(s.distanceM)),
      route: Array.isArray(s.route) ? s.route.filter(isPt) : [],
      lastFix: isPt(s.lastFix) ? s.lastFix : null, pendingBreak: !!s.pendingBreak,
      updatedAt: num(s.updatedAt, num(s.startedAt))
    };
  } catch { return null; }
};
export const saveActive = (s: Session) => { set(K_ACTIVE, JSON.stringify(s)); };
export const clearActive = () => del(K_ACTIVE);

export const loadWeight = (): number => {
  const n = Number(get(K_WEIGHT));
  return Number.isFinite(n) && n >= 20 && n <= 300 ? n : DEFAULT_WEIGHT_KG;
};
export const saveWeight = (n: number) => { set(K_WEIGHT, String(n)); };

/* ---------- geometry ---------- */
export const haversineM = (a: {lat: number; lng: number}, b: {lat: number; lng: number}): number => {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

/* ---------- session state machine ---------- */
export const newSession = (now: number): Session => ({
  state: 'running', startedAt: now, accumMs: 0, segStart: now, distanceM: 0,
  route: [], lastFix: null, pendingBreak: false, updatedAt: now
});

export const elapsedMs = (s: Session, now: number): number =>
  s.accumMs + (s.state === 'running' && s.segStart != null ? Math.max(0, now - s.segStart) : 0);

export const pauseSession = (s: Session, now: number): Session => ({
  ...s, accumMs: elapsedMs(s, now), state: 'paused', segStart: null, lastFix: null, pendingBreak: true, updatedAt: now
});

export const resumeSession = (s: Session, now: number): Session => ({
  ...s, state: 'running', segStart: now, lastFix: null, pendingBreak: true, updatedAt: now
});

/** A walk recovered after the app was closed: count time only up to the last saved moment. */
export const recoverSession = (s: Session): Session =>
  s.state === 'running' && s.segStart != null
    ? {...s, accumMs: s.accumMs + Math.max(0, s.updatedAt - s.segStart), state: 'paused', segStart: null, lastFix: null, pendingBreak: true}
    : {...s, state: 'paused', segStart: null, lastFix: null, pendingBreak: true};

/** Apply one GPS fix. Returns the same object if the fix is rejected. */
export const applyFix = (s: Session, f: Fix): Session => {
  if (s.state !== 'running') return s;
  if (!Number.isFinite(f.lat) || !Number.isFinite(f.lng) || !Number.isFinite(f.acc) || !Number.isFinite(f.t)) return s;
  if (Math.abs(f.lat) > 90 || Math.abs(f.lng) > 180) return s;
  if (f.acc > MAX_ACC_M) return s;
  const pt: Pt = {lat: f.lat, lng: f.lng, t: f.t, acc: Math.round(f.acc)};

  if (!s.lastFix) {
    const first = s.pendingBreak && s.route.length > 0 ? {...pt, b: 1 as const} : pt;
    return {...s, route: [...s.route, first], lastFix: pt, pendingBreak: false, updatedAt: f.t};
  }
  const d = haversineM(s.lastFix, pt);
  const dt = (f.t - s.lastFix.t) / 1000;
  if (dt <= 0) return s;
  if (d / dt > MAX_SPEED_MS) return s;                    // GPS jump
  if (d < Math.max(3, Math.min(f.acc, 20) * 0.5)) return s; // standing still / jitter
  return {...s, distanceM: s.distanceM + d, route: [...s.route, pt], lastFix: pt, updatedAt: f.t};
};

/* ---------- metrics ---------- */
export const metForSpeed = (kmh: number): number =>
  kmh < 3.2 ? 2.8 : kmh < 4.8 ? 3.5 : kmh < 5.6 ? 4.3 : kmh < 6.4 ? 5.0 : 6.3;

/** Rough estimate only: MET x weight x hours. Not a medical measurement. */
export const estimateKcal = (distanceM: number, durationSec: number, weightKg: number): number => {
  if (durationSec <= 0) return 0;
  const kmh = distanceM > 0 ? (distanceM / 1000) / (durationSec / 3600) : 3.5;
  return Math.max(0, metForSpeed(kmh) * weightKg * (durationSec / 3600));
};

export const paceSecPerKm = (distanceM: number, durationSec: number): number | null =>
  distanceM >= 20 && durationSec > 0 ? durationSec / (distanceM / 1000) : null;

export const speedKmh = (distanceM: number, durationSec: number): number =>
  durationSec > 0 ? (distanceM / 1000) / (durationSec / 3600) : 0;

export const thinRoute = (route: Pt[], max = MAX_ROUTE_PTS): Pt[] => {
  if (route.length <= max) return route;
  const step = (route.length - 1) / (max - 1);
  const out: Pt[] = [];
  for (let i = 0; i < max; i++) out.push(route[Math.round(i * step)]);
  return out;
};

export const finishSession = (s: Session, now: number, weightKg: number): Walk | null => {
  const durationSec = Math.round(elapsedMs(s, now) / 1000);
  if (durationSec < MIN_SAVE_SEC) return null;
  return {
    id: `w${s.startedAt}`, start: s.startedAt, end: now, durationSec,
    distanceM: Math.round(s.distanceM), kcal: Math.round(estimateKcal(s.distanceM, durationSec, weightKg)),
    weightKg, route: thinRoute(s.route)
  };
};

/* ---------- formatting & day helpers ---------- */
export const fmtKm = (m: number) => (m / 1000).toFixed(2);
export const fmtDur = (sec: number) => {
  const s = Math.max(0, Math.floor(sec)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`;
};
export const fmtPace = (secPerKm: number | null) => {
  if (secPerKm == null || !Number.isFinite(secPerKm) || secPerKm > 3600) return '--:--';
  const m = Math.floor(secPerKm / 60), r = Math.round(secPerKm % 60);
  return r === 60 ? `${m + 1}:00` : `${m}:${String(r).padStart(2, '0')}`;
};
export const dayKeyOf = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const totalsFor = (walks: Walk[], fromMs: number) => {
  const list = walks.filter(w => w.start >= fromMs);
  return {
    count: list.length,
    distanceM: list.reduce((a, w) => a + w.distanceM, 0),
    durationSec: list.reduce((a, w) => a + w.durationSec, 0),
    kcal: list.reduce((a, w) => a + w.kcal, 0)
  };
};
export const startOfToday = (now: number) => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime(); };
