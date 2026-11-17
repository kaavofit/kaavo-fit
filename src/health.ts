/* Apple Health / Health Connect wrapper (read-only, manual sync, native app only). */
import {Capacitor} from '@capacitor/core';
import {useCallback, useState} from 'react';

export type HealthSnapshot = {
  day: string; at: number; source: 'Apple Health' | 'Health Connect';
  steps: number | null; distanceM: number | null; kcal: number | null;
};
export type HealthStatus = 'web' | 'idle' | 'working' | 'synced' | 'denied' | 'unavailable' | 'empty' | 'error';

const KEY = 'kf-health-last';
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const loadSnapshot = (): HealthSnapshot | null => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.day === dayKey(new Date()) && (s.source === 'Apple Health' || s.source === 'Health Connect')) return s as HealthSnapshot;
  } catch { /* ignore */ }
  return null;
};

export const healthSourceName = (): 'Apple Health' | 'Health Connect' | null => {
  if (!Capacitor.isNativePlatform()) return null;
  return Capacitor.getPlatform() === 'ios' ? 'Apple Health' : 'Health Connect';
};

const sumSamples = (res: any): number | null => {
  const list = Array.isArray(res?.samples) ? res.samples : [];
  if (!list.length) return null;
  let t = 0;
  for (const s of list) { const v = Number(s?.value); if (Number.isFinite(v)) t += v; }
  return t;
};

async function readToday(Health: any, dataType: string, start: Date, end: Date): Promise<number | null> {
  const startDate = start.toISOString(), endDate = end.toISOString();
  try {
    if (typeof Health.queryAggregated === 'function') {
      const r = await Health.queryAggregated({dataType, startDate, endDate, bucket: 'day', aggregation: 'sum'});
      const v = sumSamples(r);
      if (v != null) return v;
    }
  } catch { /* fall through */ }
  try {
    const r = await Health.readSamples({dataType, startDate, endDate, limit: 1000});
    return sumSamples(r);
  } catch { return null; }
}

export function useHealth() {
  const [status, setStatus] = useState<HealthStatus>(Capacitor.isNativePlatform() ? 'idle' : 'web');
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(loadSnapshot);
  const [detail, setDetail] = useState('');

  const sync = useCallback(async () => {
    const source = healthSourceName();
    if (!source) { setStatus('web'); return; }
    setStatus('working'); setDetail('');
    try {
      const mod: any = await import('@capgo/capacitor-health');
      const Health = mod.Health;
      const avail = await Health.isAvailable();
      if (!avail?.available) { setStatus('unavailable'); setDetail(String(avail?.reason || '')); return; }

      const auth = await Health.requestAuthorization({read: ['steps', 'distance', 'calories']});
      if (Array.isArray(auth?.readAuthorized) && auth.readAuthorized.length === 0) { setStatus('denied'); return; }

      const end = new Date(), start = new Date(end); start.setHours(0, 0, 0, 0);
      const [steps, distanceM, kcal] = await Promise.all([
        readToday(Health, 'steps', start, end),
        readToday(Health, 'distance', start, end),
        readToday(Health, 'calories', start, end)
      ]);
      if (steps == null && distanceM == null && kcal == null) { setStatus('empty'); return; }
      const snap: HealthSnapshot = {
        day: dayKey(end), at: end.getTime(), source,
        steps: steps == null ? null : Math.round(steps),
        distanceM: distanceM == null ? null : Math.round(distanceM),
        kcal: kcal == null ? null : Math.round(kcal)
      };
      try { localStorage.setItem(KEY, JSON.stringify(snap)); } catch { /* storage blocked */ }
      setSnapshot(snap); setStatus('synced');
    } catch (e: any) {
      setStatus('error'); setDetail(String(e?.message || e || ''));
    }
  }, []);

  return {status, snapshot, detail, sync, source: healthSourceName()};
}
