import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, Apple, CheckCircle2, Dumbbell, Flame, GlassWater,
  Home, Languages, Menu, Pause, Play, RotateCcw, Sparkles,
  Trophy, X, ShoppingBag, ChevronRight, Clock, ShieldCheck
} from 'lucide-react';

type Tab = 'Today' | 'Workouts' | 'Meals' | 'Track' | 'Habits' | 'Shop';
type Lang = 'en' | 'hi';

const TABS: Tab[] = ['Today', 'Workouts', 'Meals', 'Track', 'Habits', 'Shop'];
const WATER_GOAL = 2000;
const HABIT_COUNT = 3;

const TAB_ICONS = {
  Today: Home,
  Workouts: Dumbbell,
  Meals: Apple,
  Track: Activity,
  Habits: CheckCircle2,
  Shop: ShoppingBag,
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

function readNumber(key: string, fallback = 0): number {
  try {
    const n = Number(localStorage.getItem(key));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

function readToday<T>(prefix: string, fallback: T): T {
  const saved = readJSON<{ date: string; value: T } | null>(
    `kf-${prefix}`,
    null
  );
  return saved?.date === todayKey() ? saved.value : fallback;
}

function saveToday(prefix: string, value: unknown) {
  saveJSON(`kf-${prefix}`, { date: todayKey(), value });
}

function getStreak() {
  const today = todayKey();
  const previousDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const lastActive = (() => {
    try {
      return localStorage.getItem('kf-last-active') || '';
    } catch {
      return '';
    }
  })();

  const streak = readNumber('kf-streak', 0);
  const best = readNumber('kf-best', 0);

  // Opening the app must not automatically increase the streak.
  return {
    streak: lastActive === today || lastActive === previousDate ? streak : 0,
    best,
  };
}

function recordDailyCompletion() {
  const today = todayKey();
  let last = '';
  try {
    last = localStorage.getItem('kf-last-active') || '';
  } catch {
    // Continue without persistence.
  }

  if (last === today) return getStreak();

  const previousDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const oldStreak = readNumber('kf-streak', 0);
  const nextStreak = last === previousDate ? oldStreak + 1 : 1;
  const nextBest = Math.max(readNumber('kf-best', 0), nextStreak);

  try {
    localStorage.setItem('kf-last-active', today);
    localStorage.setItem('kf-streak', String(nextStreak));
    localStorage.setItem('kf-best', String(nextBest));
  } catch {
    // Current session still works without persistence.
  }

  return { streak: nextStreak, best: nextBest };
}

function Icon({
  icon: IconComponent,
  size = 20,
  className = '',
}: {
  icon: typeof Home;
  size?: number;
  className?: string;
}) {
  return (
    <IconComponent
      size={size}
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    />
  );
}

/* ---------- Squat movement demo ---------- */
function Squat({
  running,
  speed,
  view,
  onRep,
  resetKey,
}: {
  running: boolean;
  speed: number;
  view: string;
  onRep: () => void;
  resetKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const repCallback = useRef(onRep);
  repCallback.current = onRep;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let frame = 0;
    let phase = 0;
    let lastTime = 0;
    let wasDown = false;
    let countedDown = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (lastTime && running) {
        phase += Math.min(50, time - lastTime) * 0.001 * speed;
      }
      lastTime = time;

      const cycle = (phase % 2.8) / 2.8;
      const s = running
        ? cycle < 0.5
          ? (1 - Math.cos(cycle * Math.PI * 2)) / 2
          : (1 + Math.cos((cycle - 0.5) * Math.PI * 2)) / 2
        : 0.08;

      const down = running && s > 0.72;
      if (down && !wasDown) countedDown = true;
      if (!down && wasDown && countedDown) {
        repCallback.current();
        countedDown = false;
      }
      wasDown = down;

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(126,217,181,0.10)';

      for (let px = 16; px < w; px += 28) {
        ctx.beginPath();
        ctx.moveTo(px, 12);
        ctx.lineTo(px, h - 12);
        ctx.stroke();
      }
      for (let py = 20; py < h; py += 28) {
        ctx.beginPath();
        ctx.moveTo(8, py);
        ctx.lineTo(w - 8, py);
        ctx.stroke();
      }

      const scale = Math.min(w / 260, h / 230);
      const cx = w / 2;
      const floor = h * 0.84;
      const hipY = h * (0.48 + s * 0.13);
      const shoulderY = hipY - 52 * scale;
      const headY = shoulderY - 21 * scale;
      const kneeY = floor - 37 * scale - s * 7 * scale;
      const spread = (view === 'side' ? 20 : 36) * scale;
      const hipX = cx + (view === 'side' ? -9 * scale : 0);

      const line = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      };

      ctx.strokeStyle = '#7ED9B5';
      ctx.lineWidth = Math.max(4, 7 * scale);
      ctx.lineCap = 'round';

      line(cx - 17 * scale, shoulderY, cx + 17 * scale, shoulderY);
      line(cx, shoulderY, hipX, hipY);
      line(cx - 17 * scale, shoulderY, cx - 34 * scale, shoulderY + 28 * scale);
      line(cx + 17 * scale, shoulderY, cx + 34 * scale, shoulderY + 28 * scale);
      line(hipX, hipY, cx - spread, kneeY);
      line(cx - spread, kneeY, cx - 30 * scale, floor - 5 * scale);
      line(hipX, hipY, cx + spread, kneeY);
      line(cx + spread, kneeY, cx + 30 * scale, floor - 5 * scale);

      ctx.fillStyle = '#D9B45B';
      ctx.beginPath();
      ctx.arc(cx, headY, 12 * scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 2;
      line(14, floor + 2, w - 14, floor + 2);

      ctx.fillStyle = '#D9B45B';
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        running ? (down ? 'SQUAT POSITION' : 'CONTROLLED MOVEMENT') : 'READY TO START',
        cx,
        20
      );

      if (running) frame = requestAnimationFrame(draw);
    };

    resize();
    draw(0);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, [running, speed, view, resetKey]);

  return (
    <canvas
      ref={canvasRef}
      className="kf-stage"
      role="img"
      aria-label="Illustrative squat movement animation"
    />
  );
}

/* ---------- Main application ---------- */
export default function App() {
  const [tab, setTab] = useState<Tab>('Today');
  const [lang, setLang] = useState<Lang>('en');
  const [drawer, setDrawer] = useState(false);
  const [water, setWater] = useState(() => readToday<number>('water', 0));
  const [habits, setHabits] = useState<boolean[]>(
    () => readToday<boolean[]>('habits', [false, false, false])
  );
  const [streakInfo, setStreakInfo] = useState(getStreak);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState('side');
  const [reps, setReps] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const [today, setToday] = useState(todayKey);

  const hi = lang === 'hi';
  const t = (en: string, hindi: string) => hi ? hindi : en;

  useEffect(() => {
    saveToday('water', water);
  }, [water]);

  useEffect(() => {
    saveToday('habits', habits);
  }, [habits]);

  // Refresh daily data if the app stays open across midnight.
  useEffect(() => {
    const checkDate = () => {
      const current = todayKey();
      if (current !== today) {
        setToday(current);
        setWater(readToday<number>('water', 0));
        setHabits(readToday<boolean[]>('habits', [false, false, false]));
        setStreakInfo(getStreak());
      }
    };

    const interval = window.setInterval(checkDate, 30000);
    document.addEventListener('visibilitychange', checkDate);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkDate);
    };
  }, [today]);

  const onRep = useCallback(() => setReps(n => n + 1), []);

  const habitLabels = [
    t('Drink 2 litres of water', '2 लीटर पानी पियो'),
    t('Move for 10 minutes', '10 मिनट चलो'),
    t('Plan your next meal', 'अगला भोजन प्लान करो'),
  ];

  const done = habits.filter(Boolean).length;
  const goalPct = Math.round((done / HABIT_COUNT) * 100);
  const waterPct = Math.min(100, Math.round((water / WATER_GOAL) * 100));

  const toggleHabit = (index: number) => {
    setHabits(previous => {
      const next = previous.map((value, i) => i === index ? !value : value);
      const completed = next.every(Boolean);

      if (completed) {
        setStreakInfo(recordDailyCompletion());
      }

      return next;
    });
  };

  const pageTitle: Record<Tab, string> = {
    Today: t('Start where you are,', 'जहाँ हो, वहीं से'),
    Workouts: t('Workouts', 'वर्कआउट'),
    Meals: t('Meals & nutrition', 'भोजन और पोषण'),
    Track: t('Track your progress', 'प्रगति ट्रैक करो'),
    Habits: t('Daily habits', 'दैनिक आदतें'),
    Shop: t('Shop', 'शॉप'),
  };

  const addWater = (amount: number) => {
    setWater(value => Math.min(5000, value + amount));
  };

  return (
    <div className="kf-shell">
      <style>{`
        .kf-shell {
          --bg: #0b2119;
          --panel: #143529;
          --panel2: #183b2d;
          --mint: #7ed9b5;
          --gold: #d9b45b;
          --muted: #a1b8ad;
          --line: rgba(126,217,181,.17);
          min-height: 100vh;
          min-height: 100dvh;
          background: var(--bg);
          color: #f2f7f3;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding-bottom: calc(92px + env(safe-area-inset-bottom));
          overflow-wrap: anywhere;
        }
        .kf-shell *, .kf-shell *::before, .kf-shell *::after { box-sizing: border-box; }
        .kf-shell button, .kf-shell select { font: inherit; }
        .kf-shell button { -webkit-tap-highlight-color: transparent; cursor: pointer; }
        .kf-shell button:focus-visible, .kf-shell select:focus-visible {
          outline: 2px solid var(--mint); outline-offset: 3px;
        }
        .kf-header {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; gap: 10px;
          min-height: 88px; padding: 12px 16px;
          background: rgba(11,33,25,.97);
          border-bottom: 1px solid rgba(126,217,181,.05);
        }
        .kf-logo {
          flex: 0 0 52px; height: 52px; border: 1px solid rgba(126,217,181,.35);
          border-radius: 18px; display: grid; place-items: center;
          background: var(--panel); color: var(--gold);
          font-size: 28px; font-weight: 800;
        }
        .kf-brand { min-width: 0; flex: 1; }
        .kf-brand strong { display: block; font-size: 17px; letter-spacing: 2px; white-space: nowrap; }
        .kf-brand strong span { color: var(--mint); }
        .kf-brand small { display: block; margin-top: 5px; font-size: 10px; letter-spacing: 2px; color: var(--muted); white-space: nowrap; }
        .kf-actions { display: flex; align-items: center; gap: 6px; }
        .kf-icon-button {
          min-width: 42px; min-height: 44px; padding: 8px;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          color: #f2f7f3; background: var(--panel); border: 1px solid var(--line);
          border-radius: 14px; font-size: 12px; white-space: nowrap;
        }
        .kf-shell svg { flex-shrink: 0; }
        .kf-main { width: 100%; max-width: 820px; margin: 0 auto; padding: 20px 16px 30px; }
        .kf-hero { padding: 18px 2px 28px; }
        .kf-eyebrow { color: var(--mint); font-size: 12px; font-weight: 700; letter-spacing: 2px; }
        .kf-hero h1 { margin: 28px 0 14px; font-size: clamp(34px, 8vw, 54px); line-height: 1.12; letter-spacing: -1.8px; }
        .kf-hero h1 em { color: var(--gold); font-style: normal; }
        .kf-shell h1 { font-size: clamp(29px, 7vw, 42px); line-height: 1.16; letter-spacing: -1px; }
        .kf-hero h1 { font-size: clamp(36px, 9vw, 54px); }
        .kf-shell h2 { font-size: 20px; line-height: 1.3; margin: 28px 0 16px; }
        .kf-shell h3 { font-size: 18px; margin: 8px 0; }
        .kf-shell p { color: var(--muted); line-height: 1.6; }
        .kf-card {
          background: linear-gradient(140deg, rgba(24,59,45,.98), rgba(17,48,36,.98));
          border: 1px solid var(--line); border-radius: 26px;
          padding: 20px; margin: 14px 0; min-width: 0;
          box-shadow: 0 8px 24px rgba(0,0,0,.05);
        }
        .kf-between { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .kf-between > * { min-width: 0; }
        .kf-gold { color: var(--gold) !important; }
        .kf-muted { color: var(--muted); }
        .kf-bar { height: 7px; background: #092219; border-radius: 99px; overflow: hidden; margin: 16px 0; }
        .kf-bar span { display: block; height: 100%; border-radius: inherit; background: var(--mint); transition: width .2s ease; }
        .kf-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; color: var(--muted); font-size: 12px; }
        .kf-meta span, .kf-inline-icon { display: inline-flex; align-items: center; gap: 6px; }
        .kf-stats { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; margin: 18px 0 30px; }
        .kf-stat { min-width: 0; padding: 16px 13px; border: 1px solid var(--line); border-radius: 23px; background: var(--panel); }
        .kf-stat small, .kf-stat label { display: block; color: var(--muted); font-size: 11px; }
        .kf-stat b { display: block; margin: 12px 0; font-size: clamp(17px,4vw,25px); overflow-wrap: anywhere; }
        .kf-stat label { line-height: 1.5; }
        .kf-water-number { font-size: 38px; font-weight: 700; margin: 14px 0; }
        .kf-water-number small { font-size: 14px; color: var(--muted); font-weight: 400; }
        .kf-buttons { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; margin-top: 16px; }
        .kf-button {
          min-height: 44px; padding: 10px 12px; border: 1px solid var(--line);
          border-radius: 15px; background: var(--panel2); color: #f2f7f3;
          display: inline-flex; align-items: center; justify-content: center;
          gap: 7px; font-size: 13px; font-weight: 650; text-align: center;
        }
        .kf-button.primary { color: #092219; background: var(--mint); border-color: transparent; }
        .kf-button.gold { color: #15281d; background: var(--gold); }
        .kf-button.muted { color: var(--muted); }
        .kf-habit { width: 100%; display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 12px 0; background: transparent; color: #f2f7f3; border: 0; border-bottom: 1px solid var(--line); text-align: left; }
        .kf-habit:last-child { border-bottom: 0; }
        .kf-check { width: 25px; height: 25px; border: 1.5px solid #739487; border-radius: 50%; display: grid; place-items: center; flex: 0 0 25px; }
        .kf-check.yes { background: var(--mint); color: #092219; border-color: var(--mint); }
        .kf-habit-label { flex: 1; min-width: 0; }
        .kf-habit-label small { display: block; margin-top: 4px; color: var(--muted); font-size: 11px; }
        .kf-link { border: 0; background: transparent; color: var(--mint); font-size: 12px; }
        .kf-stage { display: block; width: 100%; height: 250px; margin: 16px 0; border-radius: 18px; background: rgba(5,24,17,.35); }
        .kf-segment { display: flex; gap: 4px; background: #0b2119; border-radius: 12px; padding: 4px; }
        .kf-segment button { border: 0; border-radius: 9px; padding: 8px 12px; color: var(--muted); background: transparent; font-size: 12px; }
        .kf-segment button.selected { background: var(--mint); color: #092219; }
        .kf-select { max-width: 90px; margin-left: 6px; padding: 8px; color: #f2f7f3; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; }
        .kf-controls { display: grid; grid-template-columns: 1.4fr 1fr; gap: 8px; margin-top: 18px; }
        .kf-note { font-size: 12px; }
        .kf-notice { color: var(--muted); font-size: 13px; line-height: 1.6; }
        .kf-nutrition { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 10px; }
        .kf-nutrition > div { min-width: 0; }
        .kf-nutrition b, .kf-nutrition small, .kf-nutrition label { display: block; margin: 8px 0; }
        .kf-nutrition small, .kf-nutrition label { color: var(--muted); font-size: 11px; }
        .kf-bottom-nav {
          position: fixed; z-index: 60; left: 0; right: 0; bottom: 0;
          display: grid; grid-template-columns: repeat(6,minmax(0,1fr));
          gap: 0; width: 100%; padding: 8px 3px calc(8px + env(safe-area-inset-bottom));
          background: rgba(11,33,25,.98); border-top: 1px solid var(--line);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        }
        .kf-bottom-nav button {
          min-width: 0; min-height: 56px; padding: 6px 0;
          border: 0; border-radius: 11px; background: transparent; color: var(--muted);
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
        }
        .kf-nav-icon { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
        .kf-nav-icon svg { width: 22px; height: 22px; }
        .kf-nav-label { display: block; width: 100%; font-size: 10px; line-height: 1.25; text-align: center; white-space: nowrap; }
        .kf-bottom-nav button.active { color: var(--mint); background: rgba(126,217,181,.10); }
        .kf-footer { padding: 12px 10px 4px; text-align: center; color: #779488; font-size: 10px; letter-spacing: .8px; }
        .kf-overlay { position: fixed; inset: 0; z-index: 100; display: flex; justify-content: flex-end; background: rgba(0,0,0,.65); }
        .kf-drawer { width: min(100%,420px); height: 100%; overflow-y: auto; padding: 24px 18px calc(28px + env(safe-area-inset-bottom)); background: var(--bg); border-left: 1px solid var(--line); }
        .kf-close { width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 12px; color: #f2f7f3; background: var(--panel); }
        @media (min-width: 700px) {
          .kf-main { padding: 28px 24px 40px; }
          .kf-bottom-nav { left: 50%; right: auto; width: min(100%, 820px); transform: translateX(-50%); border-radius: 18px 18px 0 0; }
          .kf-nav-label { font-size: 12px; }
        }
        @media (max-width: 370px) {
          .kf-header { gap: 7px; padding: 10px; }
          .kf-logo { flex-basis: 42px; height: 44px; border-radius: 14px; font-size: 24px; }
          .kf-brand strong { font-size: 13px; letter-spacing: 1px; }
          .kf-brand small { font-size: 8px; letter-spacing: 1px; }
          .kf-actions { gap: 4px; }
          .kf-icon-button { min-width: 36px; padding: 7px; font-size: 10px; gap: 4px; }
          .kf-icon-button svg { width: 16px; height: 16px; }
          .kf-card { padding: 16px; border-radius: 21px; }
          .kf-stats { gap: 7px; }
          .kf-stat { padding: 13px 9px; }
          .kf-stat small { font-size: 10px; }
          .kf-buttons { gap: 5px; }
          .kf-button { padding: 9px 4px; font-size: 11px; }
          .kf-nav-label { font-size: 9px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .kf-shell *, .kf-shell *::before, .kf-shell *::after { scroll-behavior: auto !important; transition: none !important; }
        }
      `}</style>

      <header className="kf-header">
        <div className="kf-logo" aria-label="KAAVO logo">K</div>
        <div className="kf-brand">
          <strong>KAAVO <span>FIT</span></strong>
          <small>TRAIN WITH INTENT</small>
        </div>
        <div className="kf-actions">
          <button
            type="button"
            className="kf-icon-button"
            onClick={() => setLang(value => value === 'en' ? 'hi' : 'en')}
            aria-label="Change language"
          >
            <Icon icon={Languages} size={17} />
            {hi ? 'HI' : 'EN'}
          </button>
          <button
            type="button"
            className="kf-icon-button"
            onClick={() => setDrawer(true)}
            aria-label="Premium and settings"
          >
            <Icon icon={Sparkles} size={17} />
            <span>Premium</span>
          </button>
          <button
            type="button"
            className="kf-icon-button"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
          >
            <Icon icon={Menu} size={20} />
          </button>
        </div>
      </header>

      <main className="kf-main">
        {tab === 'Today' && (
          <>
            <section className="kf-hero">
              <div className="kf-eyebrow">● {t('YOUR DAILY RESET', 'आपका डेली रीसेट')}</div>
              <h1>{pageTitle.Today}<br /><em>{t('today.', 'आज से शुरू करो।')}</em></h1>
              <p>{t('Your only competition is yesterday.', 'तुम्हारी तुलना सिर्फ कल से है।')}</p>
            </section>

            <section className="kf-card">
              <div className="kf-between">
                <span>{t("Today's goal", 'आज का लक्ष्य')}</span>
                <strong className="kf-gold">{done} / {HABIT_COUNT}</strong>
              </div>
              <div className="kf-bar"><span style={{ width: `${goalPct}%` }} /></div>
              <div className="kf-meta">
                <span><Icon icon={Flame} size={16} /> {streakInfo.streak} {t('day streak', 'दिन की स्ट्रीक')}</span>
                <span><Icon icon={Trophy} size={16} /> {done} / 3 {t('goals', 'लक्ष्य')}</span>
              </div>
            </section>

            <section className="kf-stats" aria-label="Daily statistics">
              <div className="kf-stat">
                <small><Icon icon={Flame} size={15} /> {t('Streak', 'स्ट्रीक')}</small>
                <b>{streakInfo.streak}</b>
                <label>{t('Best', 'रिकॉर्ड')}: {streakInfo.best}</label>
              </div>
              <div className="kf-stat">
                <small><Icon icon={GlassWater} size={15} /> {t('Water', 'पानी')}</small>
                <b>{water} ml</b>
                <label>{t('Goal: 2000 ml', 'लक्ष्य: 2000 ml')}</label>
              </div>
              <div className="kf-stat">
                <small><Icon icon={Trophy} size={15} /> {t('Goals', 'लक्ष्य')}</small>
                <b>{done}/3</b>
                <label>{t('Daily habits', 'दैनिक आदतें')}</label>
              </div>
            </section>

            <h2>{t('Your daily dashboard', 'तुम्हारा डेली डैशबोर्ड')}</h2>
            <section className="kf-card">
              <div className="kf-between">
                <strong className="kf-inline-icon"><Icon icon={GlassWater} size={25} /> {t('Water', 'पानी')}</strong>
                <span>{waterPct}%</span>
              </div>
              <div className="kf-water-number">
                {water}<small> ml / {WATER_GOAL} ml</small>
              </div>
              <div
                className="kf-bar"
                role="progressbar"
                aria-label="Water intake"
                aria-valuemin={0}
                aria-valuemax={WATER_GOAL}
                aria-valuenow={Math.min(water, WATER_GOAL)}
              >
                <span style={{ width: `${waterPct}%` }} />
              </div>
              <div className="kf-buttons">
                <button type="button" className="kf-button primary" onClick={() => addWater(250)}>+250 ml</button>
                <button type="button" className="kf-button primary" onClick={() => addWater(500)}>+500 ml</button>
                <button type="button" className="kf-button muted" onClick={() => setWater(0)}>
                  <Icon icon={RotateCcw} size={14} /> {t('Reset', 'रीसेट')}
                </button>
              </div>
            </section>

            <h2 className="kf-between">
              <span>{t('Daily habits', 'दैनिक आदतें')}</span>
              <button type="button" className="kf-link" onClick={() => setTab('Habits')}>
                {t('View all', 'सब देखें')} <Icon icon={ChevronRight} size={14} />
              </button>
            </h2>
            <section className="kf-card">
              {habitLabels.map((label, i) => (
                <button type="button" className="kf-habit" key={label} onClick={() => toggleHabit(i)} aria-pressed={habits[i]}>
                  <span className={`kf-check ${habits[i] ? 'yes' : ''}`}>{habits[i] ? <Icon icon={CheckCircle2} size={17} /> : null}</span>
                  <span className="kf-habit-label">{label}</span>
                  <Icon icon={ChevronRight} size={17} />
                </button>
              ))}
            </section>
          </>
        )}

        {tab === 'Workouts' && (
          <>
            <div className="kf-eyebrow">{t('MOVE WITH PURPOSE', 'मकसद के साथ चलो')}</div>
            <h1>{pageTitle.Workouts}</h1>
            <p>{t('Train consistently. Progress patiently.', 'नियमित ट्रेन करो। धैर्य से आगे बढ़ो।')}</p>
            <h2>{t('Workout trainer', 'वर्कआउट ट्रेनर')} <span className="kf-muted" style={{ fontSize: 11 }}>2D DEMO</span></h2>
            <section className="kf-card">
              <div className="kf-between">
                <div>
                  <small className="kf-gold">{t('LOWER BODY', 'लोअर बॉडी')}</small>
                  <h3>{t('Squat · Phase 1', 'स्क्वाट · फेज़ 1')}</h3>
                </div>
                <strong className="kf-gold">{reps} {t('reps', 'रेप्स')}</strong>
              </div>
              <Squat running={running} speed={speed} view={view} onRep={onRep} resetKey={resetKey} />
              <div className="kf-between" style={{ flexWrap: 'wrap' }}>
                <div className="kf-segment">
                  <button type="button" className={view === 'front' ? 'selected' : ''} onClick={() => setView('front')}>{t('Front', 'सामने')}</button>
                  <button type="button" className={view === 'side' ? 'selected' : ''} onClick={() => setView('side')}>{t('Side', 'साइड')}</button>
                </div>
                <label style={{ fontSize: 12 }}>
                  {t('Speed', 'स्पीड')}
                  <select className="kf-select" value={speed} onChange={e => setSpeed(Number(e.target.value))}>
                    <option value={0.5}>0.5×</option>
                    <option value={1}>1×</option>
                    <option value={1.5}>1.5×</option>
                    <option value={2}>2×</option>
                  </select>
                </label>
              </div>
              <div className="kf-controls">
                <button type="button" className="kf-button primary" onClick={() => setRunning(value => !value)}>
                  <Icon icon={running ? Pause : Play} size={17} />
                  {running ? t('Pause workout', 'वर्कआउट रोकें') : t('Start workout', 'वर्कआउट शुरू करें')}
                </button>
                <button type="button" className="kf-button" onClick={() => { setRunning(false); setReps(0); setResetKey(value => value + 1); }}>
                  <Icon icon={RotateCcw} size={15} /> {t('Reset', 'रीसेट')}
                </button>
              </div>
              <p className="kf-note">{t('Illustrative 2D demo only. It does not assess your real exercise form.', 'यह सिर्फ 2D डेमो है। यह तुम्हारे असली एक्सरसाइज़ फॉर्म की जाँच नहीं करता।')}</p>
            </section>
            <h2>{t('Explore programs', 'प्रोग्राम देखें')}</h2>
            <section className="kf-card">
              <strong>{t('Foundation · Beginner', 'फ़ाउंडेशन · शुरुआती')}</strong>
              <p>{t('Build a consistent base.', 'नियमितता की मज़बूत शुरुआत करो।')}</p>
              <button type="button" className="kf-button" onClick={() => setDrawer(true)}>{t('Explore Premium', 'Premium देखें')} <Icon icon={ChevronRight} size={15} /></button>
            </section>
          </>
        )}

        {tab === 'Meals' && (
          <>
            <h1>{pageTitle.Meals}</h1>
            <p>{t('Build consistency, one meal at a time.', 'एक-एक भोजन से नियमितता बनाओ।')}</p>
            <section className="kf-card">
              <small className="kf-gold">{t('DAILY OVERVIEW', 'आज का सारांश')}</small>
              <h2>{t('Nutrition snapshot', 'पोषण की झलक')}</h2>
              <div className="kf-nutrition">
                <div><small>{t('Calories', 'कैलोरी')}</small><b>—</b><label>{t('Not configured', 'सेट नहीं है')}</label></div>
                <div><small>{t('Protein', 'प्रोटीन')}</small><b>—</b><label>{t('Not configured', 'सेट नहीं है')}</label></div>
                <div><small>{t('Meals', 'भोजन')}</small><b>0 / 4</b><label>{t('Log meals', 'भोजन दर्ज करें')}</label></div>
              </div>
            </section>
            <h2>{t('Diet plans', 'डाइट प्लान')}</h2>
            <section className="kf-card">
              <strong>{t('Balanced Indian vegetarian', 'संतुलित भारतीय शाकाहारी')}</strong>
              <p>{t('Flexible everyday meal ideas.', 'रोज़मर्रा के आसान भोजन के सुझाव।')}</p>
              <button type="button" className="kf-button" onClick={() => setDrawer(true)}>Premium <Icon icon={ChevronRight} size={15} /></button>
            </section>
          </>
        )}

        {tab === 'Track' && (
          <>
            <h1>{pageTitle.Track}</h1>
            <p>{t('Your current demo data is stored in this browser.', 'डेमो डेटा इसी ब्राउज़र में सेव होता है।')}</p>
            <section className="kf-stats" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
              {[
                [t('Water', 'पानी'), `${water} ml`],
                [t('Weight', 'वज़न'), '— kg'],
                [t('Steps', 'कदम'), '—'],
                [t('Sleep', 'नींद'), '— h'],
              ].map(([label, value]) => (
                <div className="kf-stat" key={label}>
                  <small>{label}</small>
                  <b>{value}</b>
                  <label>{t('Not connected', 'कनेक्ट नहीं है')}</label>
                </div>
              ))}
            </section>
            <section className="kf-card kf-notice">
              <Icon icon={ShieldCheck} size={20} />
              <p>{t('Demo only. Apple Health, Health Connect and cloud syncing are not connected.', 'सिर्फ डेमो। Apple Health, Health Connect और क्लाउड सिंक कनेक्ट नहीं हैं।')}</p>
            </section>
          </>
        )}

        {tab === 'Habits' && (
          <>
            <h1>{pageTitle.Habits}</h1>
            <p>{t('Small actions, repeated daily.', 'छोटे कदम, रोज़ दोहराओ।')}</p>
            <section className="kf-card">
              <div className="kf-between">
                <strong>{t("Today's progress", 'आज की प्रगति')}</strong>
                <strong className="kf-gold">{done}/3</strong>
              </div>
              <div className="kf-bar"><span style={{ width: `${goalPct}%` }} /></div>
              {habitLabels.map((label, i) => (
                <button type="button" className="kf-habit" key={label} onClick={() => toggleHabit(i)} aria-pressed={habits[i]}>
                  <span className={`kf-check ${habits[i] ? 'yes' : ''}`}>{habits[i] ? <Icon icon={CheckCircle2} size={17} /> : null}</span>
                  <span className="kf-habit-label">
                    {label}
                    <small>{habits[i] ? t('Completed today', 'आज पूरा हुआ') : t('Tap to complete', 'पूरा करने के लिए टैप करें')}</small>
                  </span>
                  <Icon icon={ChevronRight} size={17} />
                </button>
              ))}
            </section>
            <p className="kf-note">{t('Habits are stored locally on this device and are not synced to an account.', 'आदतें इसी डिवाइस पर सेव होती हैं और किसी अकाउंट से सिंक नहीं होतीं।')}</p>
          </>
        )}

        {tab === 'Shop' && (
          <>
            <h1>{pageTitle.Shop}</h1>
            <p>{t('Your fitness essentials, all in one place.', 'तुम्हारी फिटनेस की ज़रूरतें, एक जगह।')}</p>
            <section className="kf-card">
              <Icon icon={ShoppingBag} size={32} />
              <h2>{t('Coming soon', 'जल्द आ रहा है')}</h2>
              <p>{t('The KAAVO FIT shop is not available yet.', 'KAAVO FIT शॉप अभी उपलब्ध नहीं है।')}</p>
            </section>
          </>
        )}

        <footer className="kf-footer">
          {t('DEMO MODE · DATA SAVED IN THIS BROWSER', 'डेमो मोड · डेटा इसी ब्राउज़र में सेव है')}
        </footer>
      </main>

      <nav className="kf-bottom-nav" aria-label="Main navigation">
        {TABS.map(name => {
          const TabIcon = TAB_ICONS[name];
          return (
            <button
              type="button"
              key={name}
              className={tab === name ? 'active' : ''}
              onClick={() => setTab(name)}
              aria-current={tab === name ? 'page' : undefined}
              aria-label={name}
            >
              <span className="kf-nav-icon"><TabIcon size={22} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="kf-nav-label">{name}</span>
            </button>
          );
        })}
      </nav>

      {drawer && (
        <div className="kf-overlay" onClick={() => setDrawer(false)}>
          <aside
            className="kf-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kf-drawer-title"
            onClick={event => event.stopPropagation()}
          >
            <div className="kf-between">
              <h2 id="kf-drawer-title">{t('Settings & Premium', 'सेटिंग्स और Premium')}</h2>
              <button type="button" className="kf-close" onClick={() => setDrawer(false)} aria-label="Close settings">
                <Icon icon={X} size={20} />
              </button>
            </div>
            <section className="kf-card">
              <Icon icon={Sparkles} size={28} />
              <h3>{t('Premium programs', 'Premium प्रोग्राम')}</h3>
              <p>{t('Subscriptions and payments are not connected. No payment will be taken from this demo.', 'सब्सक्रिप्शन और पेमेंट कनेक्ट नहीं हैं। इस डेमो से कोई भुगतान नहीं होगा।')}</p>
              <button type="button" className="kf-button primary" onClick={() => setDrawer(false)}>{t('Got it', 'समझ गया')}</button>
            </section>
            <section className="kf-card kf-notice">
              <Icon icon={ShieldCheck} size={20} />
              <p>{t('No account login or remote database is configured. Do not enter sensitive information.', 'लॉगिन या रिमोट डेटाबेस सेट नहीं है। संवेदनशील जानकारी दर्ज न करें।')}</p>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
