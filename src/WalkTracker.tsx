import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {MapPin, Pause, Play, Square, Trash2} from 'lucide-react';
import {
  DAILY_GOAL_MIN, applyFix, clearActive, dayKeyOf, elapsedMs, estimateKcal, finishSession, fmtDur, fmtKm, fmtPace,
  loadActive, loadWalks, loadWeight, newSession, pauseSession, paceSecPerKm, recoverSession, resumeSession,
  saveActive, saveWalks, saveWeight, speedKmh, startOfToday, totalsFor
} from './walks';
import type {Pt, Session, Walk} from './walks';

type T = (en: string, hi: string) => string;
type GpsErr = '' | 'unsupported' | 'denied' | 'unavailable' | 'timeout';

/* ---------- route preview (plain SVG, no map tiles, works offline) ---------- */
function RouteSvg({route, t}: {route: Pt[]; t: T}) {
  const geo = useMemo(() => {
    if (route.length < 2) return null;
    const lats = route.map(p => p.lat), lngs = route.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const w = Math.max((maxLng - minLng) * k, 1e-6), h = Math.max(maxLat - minLat, 1e-6);
    const W = 300, H = 170, pad = 14, s = Math.min((W - 2 * pad) / w, (H - 2 * pad) / h);
    const ox = (W - w * s) / 2, oy = (H - h * s) / 2;
    const xy = (p: Pt) => [ox + (p.lng - minLng) * k * s, H - oy - (p.lat - minLat) * s] as const;
    const segs: string[] = []; let cur: string[] = [];
    for (const p of route) {
      const [x, y] = xy(p);
      if (p.b && cur.length) { segs.push(cur.join(' ')); cur = []; }
      cur.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    if (cur.length) segs.push(cur.join(' '));
    return {segs, a: xy(route[0]), z: xy(route[route.length - 1])};
  }, [route]);

  if (!geo) return <p className="note">{t('No route points recorded.', 'कोई रूट पॉइंट दर्ज नहीं हुआ।')}</p>;
  return (
    <>
      <svg className="kw-route" viewBox="0 0 300 170" role="img" aria-label={t('Walk route', 'वॉक का रूट')}>
        {geo.segs.map((pts, i) => <polyline key={i} points={pts} fill="none" stroke="#7ED9B5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}
        <circle cx={geo.a[0]} cy={geo.a[1]} r="5" fill="#7ED9B5" />
        <circle cx={geo.z[0]} cy={geo.z[1]} r="5" fill="#D9B45B" />
      </svg>
      <p className="note">{t('Route preview (no map tiles). Green = start, gold = end.', 'रूट का पूर्वावलोकन (बिना नक्शे के)। हरा = शुरुआत, सुनहरा = अंत।')}</p>
    </>
  );
}

/* ---------- main component ---------- */
export default function WalkTracker({t, hi}: {t: T; hi: boolean}) {
  const sessRef = useRef<Session | null>(null);
  const watchRef = useRef<number | null>(null);
  const wakeRef = useRef<any>(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick(n => n + 1), []);

  const [walks, setWalks] = useState<Walk[]>(loadWalks);
  const [weightTxt, setWeightTxt] = useState(() => String(loadWeight()));
  const [gpsErr, setGpsErr] = useState<GpsErr>('');
  const [acc, setAcc] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const weightNum = Number(weightTxt);
  const weightOk = Number.isFinite(weightNum) && weightNum >= 20 && weightNum <= 300;
  const weightKg = weightOk ? weightNum : loadWeight();
  useEffect(() => { if (weightOk) saveWeight(weightNum); }, [weightOk, weightNum]);

  const setSess = (s: Session | null) => {
    sessRef.current = s;
    if (s) saveActive(s); else clearActive();
    bump();
  };

  /* wake lock: keep screen on while walking (where supported) */
  const releaseWake = useCallback(() => {
    try { wakeRef.current?.release?.(); } catch { /* ignore */ }
    wakeRef.current = null;
  }, []);
  const requestWake = useCallback(async () => {
    try {
      const wl = (navigator as any).wakeLock;
      if (wl?.request && !wakeRef.current) wakeRef.current = await wl.request('screen');
    } catch { wakeRef.current = null; }
  }, []);

  const stopWatch = useCallback(() => {
    if (watchRef.current != null && 'geolocation' in navigator) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
  }, []);

  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator)) { setGpsErr('unsupported'); return false; }
    stopWatch();
    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        setGpsErr('');
        const s = sessRef.current;
        if (!s || s.state !== 'running') return;
        const c = pos.coords;
        setAcc(c.accuracy);
        const next = applyFix(s, {lat: c.latitude, lng: c.longitude, t: pos.timestamp || Date.now(), acc: c.accuracy});
        if (next !== s) { sessRef.current = next; saveActive(next); bump(); }
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) {
          setGpsErr('denied'); stopWatch(); releaseWake();
          const s = sessRef.current;
          if (s && s.state === 'running') setSess(pauseSession(s, Date.now()));
        } else if (err.code === err.POSITION_UNAVAILABLE) setGpsErr('unavailable');
        else setGpsErr('timeout');
      },
      {enableHighAccuracy: true, maximumAge: 0, timeout: 20000}
    );
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopWatch, releaseWake, bump]);

  /* recover an unfinished walk after reload; clean up on unmount */
  useEffect(() => {
    const a = loadActive();
    if (a) { sessRef.current = recoverSession(a); saveActive(sessRef.current); setMsg('recovered'); bump(); }
    return () => { stopWatch(); releaseWake(); };
  }, [bump, stopWatch, releaseWake]);

  /* 1s clock while running; keep wake lock alive when the page becomes visible again */
  const running = sessRef.current?.state === 'running';
  useEffect(() => {
    if (!running) return;
    let n = 0;
    const id = window.setInterval(() => {
      n++; bump();
      const s = sessRef.current;
      if (s && n % 10 === 0) saveActive({...s, updatedAt: Date.now()});
    }, 1000);
    const vis = () => { if (document.visibilityState === 'visible') requestWake(); };
    document.addEventListener('visibilitychange', vis);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, [running, bump, requestWake]);

  /* ---------- actions ---------- */
  const start = () => {
    setMsg(''); setGpsErr(''); setAcc(null);
    if (!startWatch()) return;
    requestWake();
    setSess(newSession(Date.now()));
  };
  const pause = () => {
    const s = sessRef.current; if (!s) return;
    stopWatch(); releaseWake(); setSess(pauseSession(s, Date.now()));
  };
  const resume = () => {
    const s = sessRef.current; if (!s) return;
    setMsg(''); setGpsErr(''); setAcc(null);
    if (!startWatch()) return;
    requestWake(); setSess(resumeSession(s, Date.now()));
  };
  const finish = () => {
    const s = sessRef.current; if (!s) return;
    stopWatch(); releaseWake();
    const w = finishSession(s, Date.now(), weightKg);
    setSess(null); setAcc(null);
    if (!w) { setMsg('short'); return; }
    const next = [w, ...walks.filter(x => x.id !== w.id)].slice(0, 200);
    setWalks(next);
    setMsg(saveWalks(next) ? 'saved' : 'storage');
    setOpen(w.id);
  };
  const remove = (id: string) => {
    if (confirmDel !== id) { setConfirmDel(id); return; }
    const next = walks.filter(w => w.id !== id);
    setWalks(next); saveWalks(next); setConfirmDel(null); if (open === id) setOpen(null);
  };
  /* ---------- derived values ---------- */
  const s = sessRef.current;
  const now = Date.now();
  const durSec = s ? elapsedMs(s, now) / 1000 : 0;
  const dist = s ? s.distanceM : 0;
  const pace = paceSecPerKm(dist, durSec);
  const kcalLive = s ? estimateKcal(dist, durSec, weightKg) : 0;

  const today = totalsFor(walks, startOfToday(now));
  const week = totalsFor(walks, startOfToday(now) - 6 * 86400000);
  const goalPct = Math.min(100, Math.round((today.durationSec / 60 / DAILY_GOAL_MIN) * 100));

  const groups = useMemo(() => {
    const m = new Map<string, Walk[]>();
    for (const w of walks) { const k = dayKeyOf(w.start); m.set(k, [...(m.get(k) || []), w]); }
    return [...m.entries()];
  }, [walks]);
  const locale = hi ? 'hi-IN' : 'en-IN';
  const fmtDay = (ms: number) => new Date(ms).toLocaleDateString(locale, {weekday: 'short', day: 'numeric', month: 'short'});
  const fmtTime = (ms: number) => new Date(ms).toLocaleTimeString(locale, {hour: '2-digit', minute: '2-digit'});

  const gpsText = (() => {
    if (gpsErr === 'unsupported') return t('GPS is not supported here.', 'यहाँ जीपीएस समर्थित नहीं है।');
    if (gpsErr === 'denied') return t('Location permission denied. Allow location for KAAVO FIT in your phone settings, then tap Resume.',
                                      'लोकेशन की अनुमति नहीं मिली। फ़ोन सेटिंग्स में KAAVO FIT के लिए लोकेशन चालू करें, फिर \u201cफिर शुरू करो\u201d दबाएँ।');
    if (gpsErr === 'unavailable') return t('Location unavailable. Turn on location services or move to open sky.',
                                           'लोकेशन उपलब्ध नहीं है। लोकेशन सेवा चालू करें या खुली जगह पर जाएँ।');
    if (!s) return t('GPS starts when you tap Start walk.', '\u201cवॉक शुरू करो\u201d दबाने पर जीपीएस शुरू होगा।');
    if (s.state === 'paused') return t('Paused. GPS is off until you resume.', 'रुका हुआ है। फिर शुरू करने तक जीपीएस बंद है।');
    if (acc == null) return t('Searching for GPS signal\u2026', 'जीपीएस सिग्नल खोज रहे हैं\u2026');
    const m = Math.round(acc);
    if (acc <= 20) return t(`GPS signal good (\u00B1${m} m)`, `जीपीएस सिग्नल अच्छा (\u00B1${m} मी)`);
    if (acc <= 35) return t(`GPS signal fair (\u00B1${m} m)`, `जीपीएस सिग्नल ठीक-ठाक (\u00B1${m} मी)`);
    return t(`GPS signal weak (\u00B1${m} m). Distance is not counted until it improves.`, `जीपीएस सिग्नल कमज़ोर (\u00B1${m} मी)। सुधरने तक दूरी नहीं जुड़ेगी।`);
  })();

  const msgText: Record<string, string> = {
    saved: t('Walk saved.', 'वॉक सेव हो गई।'),
    short: t('Walk was under 10 seconds, so it was not saved.', 'वॉक 10 सेकंड से कम थी, इसलिए सेव नहीं हुई।'),
    storage: t('Could not save: device storage is full or blocked.', 'सेव नहीं हो सका: डिवाइस स्टोरेज भरा या बंद है।'),
    recovered: t('An unfinished walk was recovered. Resume or finish it.', 'एक अधूरी वॉक वापस मिली। इसे फिर शुरू करो या पूरा करो।')
  };

  return (
    <>
      <h2>{t('Walk tracker', 'वॉक ट्रैकर')} <small>{t('GPS', 'जीपीएस')}</small></h2>
      <div className="card">
        <div className="between">
          <b><MapPin size={14} style={{verticalAlign: '-2px'}} /> {s ? (s.state === 'running' ? t('Walking\u2026', 'वॉक जारी है\u2026') : t('Paused', 'रुका हुआ')) : t('Ready', 'तैयार')}</b>
          <b className="gold">{fmtDur(durSec)}</b>
        </div>

        <div className="stats two kw-live">
          <div><small>{t('Distance', 'दूरी')}</small><b>{fmtKm(dist)} <span className="kw-u">{t('km', 'किमी')}</span></b></div>
          <div><small>{t('Pace', 'गति')}</small><b>{fmtPace(pace)} <span className="kw-u">{t('min/km', 'मिनट/किमी')}</span></b></div>
          <div><small>{t('Speed', 'रफ़्तार')}</small><b>{speedKmh(dist, durSec).toFixed(1)} <span className="kw-u">{t('km/h', 'किमी/घंटा')}</span></b></div>
          <div><small>{t('Calories (estimate)', 'कैलोरी (अनुमान)')}</small><b>{Math.round(kcalLive)}</b></div>
        </div>

        <p className={'kw-gps' + (gpsErr ? ' bad' : '')} role="status">{gpsText}</p>
        {msg && <p className={msg === 'saved' ? 'kw-ok' : 'kw-gps'} role="status">{msgText[msg]}</p>}

        <div className="controls">
          {!s && <button className="primary" onClick={start}><Play size={15} /> {t('Start walk', 'वॉक शुरू करो')}</button>}
          {s?.state === 'running' && <button className="primary" onClick={pause}><Pause size={15} /> {t('Pause', 'रोको')}</button>}
          {s?.state === 'paused' && <button className="primary" onClick={resume}><Play size={15} /> {t('Resume', 'फिर शुरू करो')}</button>}
          {s && <button onClick={finish}><Square size={14} /> {t('Finish', 'पूरा करो')}</button>}
        </div>

        {s && s.route.length > 1 && <RouteSvg route={s.route} t={t} />}

        <label className="kw-weight">
          <span>{t('Your weight for the calorie estimate (kg)', 'कैलोरी अनुमान के लिए आपका वज़न (किलो)')}</span>
          <input className="kw-input" type="number" inputMode="decimal" min={20} max={300} step="0.1"
                 value={weightTxt} onChange={e => setWeightTxt(e.target.value)} aria-invalid={!weightOk} />
        </label>
        {!weightOk && <p className="kw-gps bad">{t('Enter a weight between 20 and 300 kg.', '20 से 300 किलो के बीच वज़न डालें।')}</p>}
        <p className="note">{t('Calories are a rough estimate from speed and your weight, not a medical measurement. Keep the app open on screen while you walk; background tracking is not included.',
                               'कैलोरी गति और आपके वज़न से लगाया गया मोटा अनुमान है, चिकित्सीय माप नहीं। चलते समय ऐप स्क्रीन पर खुला रखें; बैकग्राउंड ट्रैकिंग शामिल नहीं है।')}</p>
      </div>

      <h2>{t('Walking activity', 'वॉकिंग गतिविधि')}</h2>
      <div className="card">
        <div className="between"><b>{t('Today', 'आज')}</b><small>{t(`Goal: ${DAILY_GOAL_MIN} min`, `लक्ष्य: ${DAILY_GOAL_MIN} मिनट`)}</small></div>
        <div className="bar"><span style={{width: `${goalPct}%`}} /></div>
        <div className="stats">
          <div><small>{t('Distance', 'दूरी')}</small><b>{fmtKm(today.distanceM)}</b><label>{t('km', 'किमी')}</label></div>
          <div><small>{t('Time', 'समय')}</small><b>{Math.round(today.durationSec / 60)}</b><label>{t('min', 'मिनट')}</label></div>
          <div><small>{t('Walks', 'वॉक')}</small><b>{today.count}</b><label>{t(`${week.count} in 7 days`, `7 दिन में ${week.count}`)}</label></div>
        </div>
        <p className="note">{t(`Last 7 days: ${fmtKm(week.distanceM)} km, ${Math.round(week.durationSec / 60)} min.`,
                               `पिछले 7 दिन: ${fmtKm(week.distanceM)} किमी, ${Math.round(week.durationSec / 60)} मिनट।`)}</p>
      </div>

      <h2>{t('Walk history', 'वॉक का इतिहास')}</h2>
      {groups.length === 0 ? (
        <div className="card notice">{t('No walks yet. Your finished walks will appear here.', 'अभी कोई वॉक नहीं। पूरी की गई वॉक यहाँ दिखेंगी।')}</div>
      ) : groups.map(([day, list]) => (
        <div className="card" key={day}>
          <small className="gold">{fmtDay(list[0].start)}</small>
          {list.map(w => (
            <div key={w.id} className="kw-row">
              <button className="kw-head" onClick={() => setOpen(open === w.id ? null : w.id)} aria-expanded={open === w.id}>
                <span>{fmtTime(w.start)}</span>
                <b>{fmtKm(w.distanceM)} {t('km', 'किमी')}</b>
                <span>{fmtDur(w.durationSec)}</span>
                <span>{fmtPace(paceSecPerKm(w.distanceM, w.durationSec))} /{t('km', 'किमी')}</span>
              </button>
              {open === w.id && (
                <div className="kw-detail">
                  <div className="stats">
                    <div><small>{t('Speed', 'रफ़्तार')}</small><b>{speedKmh(w.distanceM, w.durationSec).toFixed(1)}</b><label>{t('km/h', 'किमी/घंटा')}</label></div>
                    <div><small>{t('Calories (est.)', 'कैलोरी (अनुमान)')}</small><b>{w.kcal}</b><label>{w.weightKg} {t('kg', 'किलो')}</label></div>
                    <div><small>{t('Points', 'पॉइंट')}</small><b>{w.route.length}</b><label>{t('route', 'रूट')}</label></div>
                  </div>
                  <RouteSvg route={w.route} t={t} />
                  <button className={'kw-del' + (confirmDel === w.id ? ' sure' : '')} onClick={() => remove(w.id)}>
                    <Trash2 size={13} /> {confirmDel === w.id ? t('Tap again to confirm', 'पक्का करने के लिए फिर टैप करो') : t('Delete', 'हटाओ')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

