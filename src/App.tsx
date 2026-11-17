import WalkTracker from './WalkTracker';
import HealthCard from './HealthCard';
import {useHealth} from './health';
import DietBrowser from './DietBrowser';
import WorkoutBrowser from './WorkoutBrowser';
import Trainer3D from './Trainer3D';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Activity, Apple, CheckCircle2, Dumbbell, Flame, GlassWater, Home, Languages, Menu, Pause, Play, RotateCcw, Sparkles, Trophy, X, ShoppingBag} from 'lucide-react';

type Tab = 'Today' | 'Workouts' | 'Meals' | 'Track' | 'Habits' | 'Shop';

/* ---------- Safe localStorage helpers ---------- */
const readWater = (): number => {
  try {
    const n = Number(localStorage.getItem('kf-water') || 0);
    return Number.isFinite(n) ? Math.max(0, Math.min(5000, n)) : 0;
  } catch { return 0; }
};
const readHabits = (): boolean[] => {
  try {
    const v = JSON.parse(localStorage.getItem('kf-habits') || '[]');
    if (Array.isArray(v) && v.length === 3) return v.map(Boolean);
  } catch { /* ignore */ }
  return [false, false, false];
};
const safeSet = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* storage blocked */ }
};

/* ---------- Daily streak ---------- */
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const loadStreak = (): {streak: number; best: number} => {
  const now = new Date();
  const todayK = dayKey(now);
  const y = new Date(now); y.setDate(y.getDate() - 1);
  const yesterdayK = dayKey(y);
  let last = '', streak = 0, best = 0;
  try {
    last = localStorage.getItem('kf-last') || '';
    streak = Number(localStorage.getItem('kf-streak')) || 0;
    best = Number(localStorage.getItem('kf-best')) || 0;
  } catch { /* ignore */ }
  if (last === todayK) streak = Math.max(streak, 1);
  else if (last === yesterdayK) streak += 1;
  else streak = 1;
  best = Math.max(best, streak);
  safeSet('kf-last', todayK); safeSet('kf-streak', String(streak)); safeSet('kf-best', String(best));
  return {streak, best};
};

/* ---------- Squat animation ---------- */
function Squat({running, speed, view, onRep, resetKey}: {running: boolean; speed: number; view: string; onRep: () => void; resetKey: number}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const onRepRef = useRef(onRep);
  onRepRef.current = onRep;

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const x = c.getContext('2d'); if (!x) return;
    let raf = 0, last = 0, phase = 0, lastDown = false, gate = false;

    const resize = () => {
      const d = window.devicePixelRatio || 1, r = c.getBoundingClientRect();
      c.width = r.width * d; c.height = r.height * d;
      x.setTransform(d, 0, 0, d, 0, 0);
    };

    const draw = (t: number) => {
      const w = c.clientWidth, h = c.clientHeight;
      if (last && running) phase += Math.min(40, t - last) * .001 * speed;
      last = t;
      const cy = (phase % 2.8) / 2.8;
      const s = running ? (cy < .5 ? (1 - Math.cos(cy * Math.PI * 2)) / 2 : (1 + Math.cos((cy - .5) * Math.PI * 2)) / 2) : .1;
      const down = s > .72;
      if (down && !lastDown) gate = true;
      if (!down && lastDown && gate) { onRepRef.current(); gate = false; }
      lastDown = down;

      x.clearRect(0, 0, w, h);
      x.strokeStyle = '#244936'; x.lineWidth = 1;
      for (let a = 20; a < w; a += 28) { x.beginPath(); x.moveTo(a, 12); x.lineTo(a, h - 12); x.stroke(); }
      for (let a = 20; a < h; a += 28) { x.beginPath(); x.moveTo(8, a); x.lineTo(w - 8, a); x.stroke(); }

      const sc = Math.min(w / 260, h / 230), cx = w / 2, f = h * .83;
      const hipY = h * (.48 + s * .13), shY = hipY - 52 * sc, headY = shY - 21 * sc;
      const kY = f - 37 * sc - s * 7 * sc;
      const spread = (view === 'side' ? 20 : 36) * sc;
      const hipX = cx + (view === 'side' ? -9 * sc : 0);
      const line = (a: number, b: number, d: number, e: number) => { x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke(); };

      x.strokeStyle = '#7ED9B5'; x.lineWidth = 7 * sc; x.lineCap = 'round';
      line(cx - 17 * sc, shY, cx + 17 * sc, shY);
      line(cx, shY, hipX, hipY);
      line(cx - 17 * sc, shY, cx - 34 * sc, shY + 27 * sc + s * 9 * sc);
      line(cx + 17 * sc, shY, cx + 34 * sc, shY + 27 * sc + s * 9 * sc);
      line(hipX, hipY, cx - spread, kY); line(cx - spread, kY, cx - 30 * sc, f - 5 * sc);
      line(hipX, hipY, cx + spread, kY); line(cx + spread, kY, cx + 30 * sc, f - 5 * sc);

      x.fillStyle = '#D9B45B'; x.beginPath(); x.arc(cx, headY, 12 * sc, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#D9B45B'; x.lineWidth = 2; x.beginPath(); x.moveTo(14, f + 2); x.lineTo(w - 14, f + 2); x.stroke();
      x.fillStyle = '#D9B45B'; x.font = '11px system-ui'; x.textAlign = 'center';
      x.fillText(running ? (down ? 'BOTTOM HOLD' : 'CONTROLLED REP') : 'PAUSED', cx, 20);

      if (running) raf = requestAnimationFrame(draw);
    };

    const onResize = () => { resize(); if (!running) draw(0); };

    resize();
    window.addEventListener('resize', onResize);
    draw(0);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [running, speed, view, resetKey]);

  return <canvas ref={ref} className="stage" aria-label="Illustrative 2D squat animation" />;
}

/* ---------- App ---------- */
export default function App() {
    const [tab, setTabRaw] = useState<Tab>((localStorage.getItem('kaavoTab') as Tab) || 'Today');
  const setTab = (n: any) => { setTabRaw(n); localStorage.setItem('kaavoTab', n); };

  const [lang, setLang] = useState(false);
  const [water, setWater] = useState(readWater);
  const [habits, setHabits] = useState<boolean[]>(readHabits);
  const [{streak, best}] = useState(loadStreak);
  const [run, setRun] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState('side');
  const [reps, setReps] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const health = useHealth();

  useEffect(() => safeSet('kf-water', String(water)), [water]);
  useEffect(() => safeSet('kf-habits', JSON.stringify(habits)), [habits]);

  const onRep = useCallback(() => setReps(v => v + 1), []);

  const hi = lang;
  const t = (en: string, hindi: string) => (hi ? hindi : en);

  // Bottom nav: labels always stay in English
  const names: Tab[] = ['Today', 'Workouts', 'Meals', 'Track', 'Habits', 'Shop'];
  const icons = [<Home />, <Dumbbell />, <Apple />, <Activity />, <CheckCircle2 />, <ShoppingBag />];

  const habitLabels = [t('Drink 2 litres of water', '2 लीटर पानी पियो'), t('Move for 10 minutes', '10 मिनट चलो'), t('Plan your next meal', 'अगला भोजन प्लान करो')];
  const toggleHabit = (i: number) => setHabits(a => a.map((q, j) => (i === j ? !q : q)));

  const done = habits.filter(Boolean).length;
  const goalPct = Math.round((done / 3) * 100);
  const waterPct = Math.min(100, Math.round(water / 20));

  const title =
    tab === 'Today' ? t('Start where you are,', 'जहाँ हो, वहीं से')
    : tab === 'Workouts' ? t('Workouts', 'वर्कआउट')
    : tab === 'Meals' ? t('Meals & nutrition', 'भोजन और पोषण')
    : tab === 'Track' ? t('Track your progress', 'प्रगति ट्रैक करो')
    : t('Daily habits', 'दैनिक आदतें');

  return (
    <div className="shell">
      <header>
        <div className="logo">K</div>
        <div className="brand"><b>KAAVO <i>FIT</i></b><small>TRAIN WITH INTENT</small></div>
        <div className="actions">
          <button onClick={() => setLang(!lang)}><Languages size={16} />{hi ? 'HI' : 'EN'}</button>
          <button onClick={() => setDrawer(true)}><Sparkles size={15} /> Premium</button>
          <button onClick={() => setDrawer(true)}><Menu size={18} /></button>
        </div>
      </header>

      <main>
        {tab === 'Shop' ? (
          <div className="hero"><h2>{t('Shop', 'शॉप')}</h2><p>{t('Coming Soon', 'जल्द आ रहा है')}</p></div>

        ) : tab === 'Today' ? (
          <>
            <div className="hero">
              <small>● {t('YOUR DAILY RESET', 'आपका डेली रीसेट')}</small>
              <h1>{title}<br /><em>{t('today.', 'शुरू करो।')}</em></h1>
              <p>{t('Your only competition is yesterday.', 'आज की मेहनत, कल से बेहतर।')}</p>
            </div>

            <div className="card goal">
              <div className="between"><span>{t("Today's goal", 'आज का लक्ष्य')}</span><b>{done} / 3</b></div>
              <div className="bar"><span style={{width: `${goalPct}%`}} /></div>
              <small><Flame /> {streak} {t('day streak', 'दिन की streak')} <span className="right"><Trophy /> {done} / 3 {t('goals', 'लक्ष्य')}</span></small>
            </div>

            <div className="stats">
              <div className="card"><small><Flame /> {t('Streak', 'Streak')}</small><b>{streak}</b><label>{t('Best', 'सबसे अच्छा')}: {best}</label></div>
              <div className="card"><small><GlassWater /> {t('Water', 'पानी')}</small><b>{water} ml</b><label>{t('Goal: 2000 ml', 'लक्ष्य: 2000 ml')}</label></div>
              <div className="card"><small><Trophy /> {t('Goals', 'लक्ष्य')}</small><b>{done}/3</b><label>{t('Stay healthy', 'स्वस्थ रहो')}</label></div>
            </div>

            <h2>{t('Your daily dashboard', 'आपका डेली डैशबोर्ड')}</h2>
            <div className="card">
              <div className="between"><b><GlassWater /> {t('Water', 'पानी')}</b><small>{waterPct}%</small></div>
              <h1 className="water">{water}<small> ml / 2000 ml</small></h1>
              <div className="bar"><span style={{width: `${waterPct}%`}} /></div>
              <div className="waterbuttons">
                <button onClick={() => setWater(v => Math.min(5000, v + 250))}>+250 ml</button>
                <button onClick={() => setWater(v => Math.min(5000, v + 500))}>+500 ml</button>
                <button className="muted" onClick={() => setWater(0)}><RotateCcw size={13} /> {t('Reset', 'रीसेट')}</button>
              </div>
            </div>

            <h2>{t('Daily habits', 'दैनिक आदतें')} <button className="link" onClick={() => setTab('Habits')}>{t('View all →', 'सब देखो →')}</button></h2>
            <div className="card">
              {habitLabels.map((v, i) => (
                <button className="habit" key={i} onClick={() => toggleHabit(i)}>
                  <span className={'check ' + (habits[i] ? 'yes' : '')}>{habits[i] ? '✓' : ''}</span>{v}<b>›</b>
                </button>
              ))}
            </div>
          </>

        ) : tab === 'Workouts' ? (
          <>
            <small className="eyebrow">{t('MOVE WITH PURPOSE', 'मकसद के साथ चलो')}</small>
            <h1>{title}</h1>
            <p>{t('Train consistently. Progress patiently.', 'नियमित ट्रेन करो। धैर्य से आगे बढ़ो।')}</p>
            {false && (<>
<h2>{t('Workout trainer', 'वर्कआउट ट्रेनर')} <small>2D DEMO</small></h2>
            <div className="card">
              <div className="between">
                <div><small className="gold">{t('LOWER BODY', 'लोअर बॉडी')}</small><h3>{t('Squat · Phase 1', 'स्क्वाट · फेज़ 1')}</h3></div>
                <b className="gold">{reps} {t('reps', 'रेप्स')}</b>
              </div>
              <Trainer3D running={run} speed={speed} view={view} onRep={onRep} resetKey={resetKey} />
              <div className="between">
                <div className="seg">
                  <button className={view === 'front' ? 'selected' : ''} onClick={() => setView('front')}>{t('Front', 'सामने')}</button>
                  <button className={view === 'side' ? 'selected' : ''} onClick={() => setView('side')}>{t('Side', 'साइड')}</button>
                </div>
                <label>{t('Speed', 'स्पीड')} <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
                  <option value={.5}>0.5×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option>
                </select></label>
              </div>
              <div className="controls">
                <button className="primary" onClick={() => setRun(v => !v)}>
                  {run ? <Pause size={16} /> : <Play size={16} />} {run ? t('Pause', 'रोको') : t('Start workout', 'वर्कआउट शुरू करो')}
                </button>
                <button onClick={() => { setRun(false); setReps(0); setResetKey(v => v + 1); }}><RotateCcw size={15} /> {t('Reset', 'रीसेट')}</button>
              </div>
              <p className="note">{t('Illustrative 2D movement demo, not a certified form assessment.', 'यह सिर्फ एक 2D डेमो है, प्रमाणित फॉर्म जाँच नहीं।')}</p>
            </div></>)}

            <WorkoutBrowser /><h2>{t('Explore programs', 'प्रोग्राम देखो')}</h2>
            <div className="card">
              <b>{t('Foundation · Beginner', 'फ़ाउंडेशन · शुरुआती')}</b>
              <p>{t('Build a consistent base.', 'एक मज़बूत बुनियाद बनाओ।')}</p>
              <button onClick={() => setDrawer(true)}>{t('Unlock with Premium →', 'Premium से अनलॉक करो →')}</button>
            </div>
          </>

        ) : tab === 'Meals' ? (
          <>
            <h1>{title}</h1>
            <p>{t('Build consistency, one meal at a time.', 'एक-एक भोजन से नियमितता बनाओ।')}</p>
            <div className="card">
              <small className="gold">{t('DAILY OVERVIEW', 'आज का सारांश')}</small>
              <h2>{t('Nutrition snapshot', 'पोषण झलक')}</h2>
              <div className="stats three">
                <div><small>{t('Calories', 'कैलोरी')}</small><b>—</b><label>{t('Not configured', 'सेट नहीं है')}</label></div>
                <div><small>{t('Protein', 'प्रोटीन')}</small><b>—</b><label>{t('Not configured', 'सेट नहीं है')}</label></div>
                <div><small>{t('Meals', 'भोजन')}</small><b>0 / 4</b><label>{t('Log meals', 'भोजन दर्ज करो')}</label></div>
              </div>
             </div>
            <DietBrowser />
             <h2>{t('Diet plans', 'डाइट प्लान')}</h2>
            <div className="card">
              <b>{t('Balanced Indian vegetarian', 'संतुलित भारतीय शाकाहारी')}</b>
              <p>{t('Flexible everyday meals.', 'रोज़ के आसान भोजन।')}</p>
              <button onClick={() => setDrawer(true)}>Premium →</button>
            </div>
          </>

        ) : tab === 'Track' ? (
          <>
            <h1>{title}</h1>
            <p>{t('Walks and tracking are saved on this device.', 'वॉक और ट्रैकिंग इसी डिवाइस पर सेव होती हैं।')}</p>
            <div className="stats two">
              {[
                [t('Water', 'पानी'), water + ' ml'],
                [t('Weight', 'वज़न'), '— kg'],
                [t('Steps', 'कदम'), health.snapshot?.steps != null ? String(health.snapshot.steps) : '—',
                  health.snapshot?.steps != null ? t('From ', '') + health.snapshot.source + t('', ' से') : ''],
                [t('Sleep', 'नींद'), '— h']
              ].map(([a, b, c]) => (
                <div className="card" key={a}><small>{a}</small><b>{b}</b><label>{c || t('Not connected', 'कनेक्ट नहीं है')}</label></div>
              ))}
            </div>
            <WalkTracker t={t} hi={hi} />
            <h2>{t('Health sync', 'हेल्थ सिंक')}</h2>
            <HealthCard t={t} health={health} />
            <div className="card notice">{t('Health sync works only in the installed app and only when you tap Sync. Nothing is uploaded or shared.', 'हेल्थ सिंक सिर्फ़ इंस्टॉल किए गए ऐप में और सिंक दबाने पर ही चलता है। कुछ भी अपलोड या साझा नहीं होता।')}</div>
          </>

        ) : (
          <>
            <h1>{title}</h1>
            <p>{t('Small actions, repeated daily.', 'छोटे कदम, रोज़ दोहराओ।')}</p>
            <div className="card">
              {habitLabels.map((v, i) => (
                <button className="habit" key={i} onClick={() => toggleHabit(i)}>
                  <span className={'check ' + (habits[i] ? 'yes' : '')}>{habits[i] ? '✓' : ''}</span>
                  <span>{v}<small>{habits[i] ? t('Completed today', 'आज पूरा हुआ') : t('Tap to complete', 'पूरा करने के लिए टैप करो')}</small></span>
                  <b>›</b>
                </button>
              ))}
            </div>
            <div className="card notice">{t('Habit completion saves in this browser only; it does not sync between devices.', 'आदतें सिर्फ इसी ब्राउज़र में सेव होती हैं; डिवाइस के बीच sync नहीं होतीं।')}</div>
          </>
        )}
      </main>

       <div className="kv-tabbar">
        {names.map((n, i) => (
          <button key={n} className={tab === n ? 'active' : ''} onClick={() => setTab(n)}>{icons[i]}<span>{n}</span></button>
        ))}
      </div>
      <footer>{t('DEMO MODE · DATA SAVED IN THIS BROWSER', 'डेमो मोड · डेटा इसी ब्राउज़र में सेव है')}</footer>

      {drawer && (
        <div className="overlay" onClick={() => setDrawer(false)}>
          <aside onClick={e => e.stopPropagation()}>
            <div className="between"><h2>{t('Settings & Premium', 'सेटिंग्स और Premium')}</h2><button onClick={() => setDrawer(false)}><X /></button></div>
            <div className="card">
              <Sparkles /><h3>{t('Premium programs', 'Premium प्रोग्राम')}</h3>
              <p>{t('Subscriptions are not connected. No payment will be taken.', 'सब्सक्रिप्शन जुड़ा नहीं है। कोई पेमेंट नहीं लिया जाएगा।')}</p>
              <button onClick={() => setDrawer(false)}>{t('Got it', 'समझ गया')}</button>
            </div>
            <p className="note">{t('No secure login or remote account is configured. Do not enter sensitive information.', 'कोई सुरक्षित लॉगिन या रिमोट अकाउंट नहीं है। संवेदनशील जानकारी न डालें।')}</p>
          </aside>
        </div>
      )}
    </div>
  );
}
