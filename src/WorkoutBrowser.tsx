import { useEffect, useRef, useState } from 'react';
import { Search, Lock, Dumbbell, Crown, X } from 'lucide-react';
import { isPremium, setPremium, unlockExercise, unlockLeft, fmtLeft } from './access';
import { EXS, Figure, KegelGuide } from './Trainer3D';
import type { Ex } from './Trainer3D';
import { EXERCISES } from './exercises';
import type { Item } from './exercises';

type W = {
  name: string;
  group: string;
  level: string;
  min: number;
  type: string;
  ex: string[];
};

const w = (name: string, group: string, level: string, min: number, type: string, ex: string): W => ({
  name, group, level, min, type, ex: ex.split('|'),
});

const WORKOUTS: W[] = [
  // HOME (first 10 = ad unlock, last 2 = Premium only)
  w('Beginner Full Body', 'Home', 'Beginner', 15, 'Strength', 'Squat|Push-up|Plank|Glute bridge'),
  w('Cardio Burst', 'Home', 'Beginner', 20, 'Cardio', 'Jumping jack|High knees|Squat|Lunge'),
  w('Core Strength', 'Home', 'Beginner', 25, 'Strength', 'Plank|Crunch|Leg raise|Mountain climber'),
  w('Yoga Flow', 'Home', 'Beginner', 30, 'Yoga', 'Cat-cow|Downward dog|Warrior|Child pose'),
  w('Stretch & Relax', 'Home', 'Beginner', 15, 'Stretch', 'Neck stretch|Hamstring stretch|Hip opener|Spine twist'),
  w('Bodyweight Workout', 'Home', 'Beginner', 20, 'Strength', 'Squat|Push-up|Lunge|Plank'),
  w('Resistance Band Workout', 'Home', 'Beginner', 30, 'Strength', 'Band row|Band squat|Band press|Band curl'),
  w('Home Cardio Workout', 'Home', 'Intermediate', 15, 'Cardio', 'Jumping jack|Skater hop|Squat|High knees'),
  w('Core & Abs Workout', 'Home', 'Intermediate', 20, 'Strength', 'Plank|Bicycle crunch|Leg raise|Russian twist'),
  w('Home HIIT 15', 'Home', 'Intermediate', 15, 'HIIT', 'Jumping jack|Squat|Push-up|Mountain climber'),
  w('Morning Yoga', 'Home', 'Beginner', 20, 'Yoga', 'Sun salutation|Cobra|Tree pose|Forward fold'),
  w('Evening Stretch', 'Home', 'Beginner', 15, 'Stretch', 'Shoulder stretch|Quad stretch|Pigeon pose|Child pose'),
  // GYM
  w('Dumbbell Workout', 'Gym', 'Intermediate', 25, 'Strength', 'Shoulder press|Bicep curl|Lateral raise|Deadlift'),
  w('Shoulder Builder', 'Gym', 'Intermediate', 25, 'Strength', 'Shoulder press|Lateral raise|Front raise|Rear fly'),
  w('Arm Day', 'Gym', 'Intermediate', 25, 'Strength', 'Bicep curl|Hammer curl|Triceps extension|Kickback'),
  w('Gym HIIT', 'Gym', 'Advanced', 20, 'HIIT', 'Kettlebell swing|Battle rope|Box jump|Rower sprint'),
  w('Gym Cardio', 'Gym', 'Beginner', 30, 'Cardio', 'Treadmill walk|Cycle|Cross trainer|Rower'),
  w('Strength Basics', 'Gym', 'Beginner', 30, 'Strength', 'Goblet squat|Chest press|Lat pulldown|Plank'),
  // SPLITS
  w('Push Day', 'Splits', 'Intermediate', 30, 'Strength', 'Chest press|Shoulder press|Triceps pushdown|Push-up'),
  w('Pull Day', 'Splits', 'Intermediate', 30, 'Strength', 'Lat pulldown|Seated row|Bicep curl|Face pull'),
  w('Leg Day', 'Splits', 'Intermediate', 30, 'Strength', 'Squat|Lunge|Deadlift|Calf raise'),
  w('Upper Body', 'Splits', 'Intermediate', 25, 'Strength', 'Push-up|Row|Shoulder press|Bicep curl'),
  w('Lower Body', 'Splits', 'Intermediate', 25, 'Strength', 'Squat|Glute bridge|Lunge|Calf raise'),
  w('Full Body Split', 'Splits', 'Advanced', 30, 'Strength', 'Deadlift|Shoulder press|Squat|Row'),
  // GOAL
  w('Fat Loss Circuit', 'Goal', 'Intermediate', 25, 'HIIT', 'Burpee|Jumping jack|Squat|Plank'),
  w('Muscle Gain Basics', 'Goal', 'Intermediate', 30, 'Strength', 'Squat|Shoulder press|Row|Deadlift'),
  w('Toned Arms', 'Goal', 'Beginner', 15, 'Strength', 'Bicep curl|Triceps dip|Lateral raise|Push-up'),
  w('Flat Abs', 'Goal', 'Intermediate', 15, 'Strength', 'Crunch|Leg raise|Plank|Bicycle crunch'),
  w('Glute Builder', 'Goal', 'Intermediate', 20, 'Strength', 'Glute bridge|Squat|Lunge|Donkey kick'),
  w('Posture Fix', 'Goal', 'Beginner', 15, 'Stretch', 'Chin tuck|Wall angel|Cat-cow|Thoracic twist'),
  w('Better Sleep Flow', 'Goal', 'Beginner', 20, 'Yoga', 'Child pose|Legs up wall|Spine twist|Deep breathing'),
  // KEGEL
  w('Kegel Basics', 'Kegel', 'Beginner', 10, 'Kegel', 'Squeeze & hold|Relax|Squeeze & hold|Relax'),
  w('Kegel Endurance', 'Kegel', 'Intermediate', 15, 'Kegel', 'Long hold|Relax|Long hold|Relax'),
  w('Kegel Quick Flicks', 'Kegel', 'Intermediate', 10, 'Kegel', 'Fast squeeze|Relax|Fast squeeze|Relax'),
  w('Pelvic Floor Relax', 'Kegel', 'Beginner', 15, 'Kegel', 'Deep breathing|Happy baby|Child pose|Relax'),
];

// Only these 10 Home workouts can be unlocked with an ad. Everything else = Premium only.
const AD_NAMES = new Set(WORKOUTS.filter((x) => x.group === 'Home').slice(0, 10).map((x) => x.name));

const norm = (n: string) => n.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');

function itemFor(name: string): Item | undefined {
  const k = norm(name);
  return EXERCISES.find((x) => norm(x.name) === k);
}

function findEx(name: string): Ex | undefined {
  const k = norm(name);
  const direct = EXS.find((e) => norm(e.name) === k);
  if (direct) return direct;
  const it = itemFor(name);
  if (it && it.anim) return EXS.find((e) => e.id === it.anim);
  return undefined;
}

const GROUPS = ['All groups', 'Home', 'Gym', 'Splits', 'Goal', 'Kegel'];
const TYPES = ['All Exercises', 'Strength', 'Cardio', 'HIIT', 'Yoga', 'Stretch', 'Kegel'];

const C = {
  card: '#223a2f',
  inner: '#1b3027',
  line: '#2e4b3d',
  gold: '#cdaa4e',
  mint: '#8fd6b4',
  text: '#ffffff',
  sub: '#a9bfb3',
};

const chip = (on: boolean): React.CSSProperties => ({
  flex: '0 0 auto',
  padding: '12px 22px',
  borderRadius: 999,
  border: '1px solid ' + C.line,
  background: on ? C.mint : '#233a30',
  color: on ? '#10261c' : C.text,
  fontWeight: 700,
  fontSize: 16,
});

const row: React.CSSProperties = { display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 };

const smallBtn = (on = false): React.CSSProperties => ({
  padding: '10px 16px',
  borderRadius: 999,
  border: '1px solid ' + C.line,
  background: on ? C.mint : '#233a30',
  color: on ? '#10261c' : C.text,
  fontWeight: 700,
  fontSize: 15,
});

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: '#10261c',
  overflowY: 'auto',
  padding: '64px 18px 40px',
  color: C.text,
};

function TempoGuide(props: {
  running: boolean;
  speed: number;
  onRep: () => void;
  resetKey: number;
  mode: 'reps' | 'hold';
  item?: Item;
  name: string;
}) {
  const [t, setT] = useState(0);
  const live = useRef(props);
  live.current = props;
  const tRef = useRef(0);
  const doneRef = useRef(0);
  const keyRef = useRef(props.resetKey);

  const cycle = props.mode === 'hold' ? 30 : 4;

  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.2);
      last = now;
      const p = live.current;
      if (p.resetKey !== keyRef.current) {
        keyRef.current = p.resetKey;
        tRef.current = 0;
        doneRef.current = 0;
      }
      if (p.running) {
        tRef.current += dt * (Number(p.speed) || 1);
        const cyc = p.mode === 'hold' ? 30 : 4;
        const n = Math.floor(tRef.current / cyc);
        if (n > doneRef.current) {
          doneRef.current = n;
          p.onRep();
        }
      }
      setT(tRef.current);
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  const tt = t % cycle;
  const frac = props.running ? tt / cycle : 0;
  let label = 'Ready';
  let sub = 'Press Start';
  let scale = 0.8;
  if (props.running) {
    if (props.mode === 'hold') {
      label = 'Hold & breathe';
      sub = Math.ceil(cycle - tt) + 's';
      scale = 0.85 + 0.1 * Math.sin(tt * 0.9);
    } else {
      const up = tt < 2;
      label = up ? 'Up' : 'Down';
      sub = up ? 'Controlled, 2 sec' : 'Slowly back, 2 sec';
      scale = up ? 0.7 + 0.3 * (tt / 2) : 1 - 0.3 * ((tt - 2) / 2);
    }
  }
  const R = 86;
  const circ = 2 * Math.PI * R;

  return (
    <div style={{ background: C.card, borderRadius: 24, padding: '18px 16px', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
        <svg width="200" height="200" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r={R} fill="none" stroke={C.line} strokeWidth="8" />
          <circle cx="100" cy="100" r={R} fill="none" stroke={C.gold} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} />
        </svg>
        <div style={{ position: 'absolute', inset: 30, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #b7efd3, #3f9d78)', transform: 'scale(' + scale + ')', boxShadow: '0 0 40px rgba(148,214,181,0.35)', transition: 'transform 0.06s linear' }} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{label}</div>
      <div style={{ color: C.sub }}>{sub}</div>
      <div style={{ textAlign: 'left', marginTop: 14, background: C.inner, borderRadius: 16, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Form tips</div>
        {(props.item ? props.item.tips : ['Move with control.', 'Keep breathing steadily.']).map((x, i) => (
          <div key={i} style={{ color: C.sub, fontSize: 15, padding: '3px 0' }}>• {x}</div>
        ))}
        {props.item && props.item.equip && (
          <div style={{ color: C.sub, fontSize: 13, marginTop: 8 }}>Equipment: {props.item.equip}</div>
        )}
      </div>
    </div>
  );
}

function Session({ wk, onClose }: { wk: W; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [run, setRun] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [view, setView] = useState('front');
  const [reps, setReps] = useState(0);
  const [rk, setRk] = useState(0);

  const name = wk.ex[i];
  const ex = findEx(name);
  const item = itemFor(name);
  const holdMode = !ex && !!item && (item.group === 'Stretch' || item.group === 'Yoga');
  const last = i === wk.ex.length - 1;

  const go = (n: number) => {
    if (n < 0 || n >= wk.ex.length) return;
    setI(n);
    setRun(false);
    setReps(0);
    setRk((k) => k + 1);
  };

  const onRep = () => setReps((r) => r + 1);

  return (
    <div style={overlay}>
      <button
        onClick={onClose}
        style={{ position: 'fixed', top: 14, right: 14, zIndex: 1001, width: 48, height: 48, borderRadius: 999, border: '1px solid ' + C.line, background: C.card, color: C.text, display: 'grid', placeItems: 'center' }}
      >
        <X size={22} />
      </button>

      <div style={{ color: C.gold, fontWeight: 700 }}>{wk.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '6px 0 12px' }}>
        <div style={{ fontSize: 26, fontWeight: 800 }}>{name}</div>
        <div style={{ color: C.gold, fontSize: 22, fontWeight: 800 }}>{reps} reps</div>
      </div>
      <div style={{ color: C.sub, marginBottom: 6 }}>Exercise {i + 1} / {wk.ex.length}</div>
      {!last && <div style={{ color: C.mint, marginBottom: 10, fontWeight: 700 }}>Next: {wk.ex[i + 1]}</div>}

      {(ex || item) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {(ex ? ex.muscles : item!.muscles).map((m) => (
            <span key={m} style={{ fontSize: 13, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,60,60,0.16)', border: '1px solid rgba(255,90,90,0.5)', color: '#ff9a9a' }}>{m}</span>
          ))}
        </div>
      )}

      {ex && ex.kegel ? (
        <KegelGuide key={ex.id + rk} running={run} speed={speed} onRep={onRep} resetKey={rk} steps={ex.kegel} />
      ) : ex ? (
        <Figure key={ex.id + rk} ex={ex} running={run} speed={speed} view={view} onRep={onRep} resetKey={rk} />
      ) : (
        <TempoGuide key={name + rk} running={run} speed={speed} onRep={onRep} resetKey={rk} mode={holdMode ? 'hold' : 'reps'} item={item} name={name} />
      )}

      {(!ex || !ex.kegel) && ex && (
        <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
          <button style={smallBtn(view === 'front')} onClick={() => setView('front')}>Front</button>
          <button style={smallBtn(view === 'side')} onClick={() => setView('side')}>Side</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0', color: C.sub }}>
        Speed
        {[0.5, 1, 1.5, 2].map((s) => (
          <button key={s} style={smallBtn(speed === s)} onClick={() => setSpeed(s)}>{s}x</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={() => setRun(!run)}
          style={{ flex: 1, padding: '18px 0', borderRadius: 999, border: 'none', background: C.mint, color: '#10261c', fontWeight: 800, fontSize: 18 }}
        >
          {run ? 'Pause' : 'Start workout'}
        </button>
        <button
          onClick={() => { setRun(false); setReps(0); setRk((k) => k + 1); }}
          style={{ padding: '18px 22px', borderRadius: 999, border: '1px solid ' + C.line, background: C.card, color: C.text, fontWeight: 800, fontSize: 16 }}
        >
          Reset
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
        <button
          onClick={() => go(i - 1)}
          disabled={i === 0}
          style={{ flex: 1, padding: '16px 0', borderRadius: 999, border: '1px solid ' + C.line, background: C.card, color: C.text, fontWeight: 800, fontSize: 16, opacity: i === 0 ? 0.4 : 1 }}
        >
          Previous
        </button>
        <button
          onClick={() => (last ? onClose() : go(i + 1))}
          style={{ flex: 1, padding: '16px 0', borderRadius: 999, border: 'none', background: C.gold, color: '#20190a', fontWeight: 800, fontSize: 16 }}
        >
          {last ? 'Finish' : 'Next exercise'}
        </button>
      </div>

      <div style={{ marginTop: 20, background: C.card, borderRadius: 20, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>All exercises</div>
        {wk.ex.map((n, idx) => (
          <button
            key={idx}
            onClick={() => go(idx)}
            style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', padding: '12px 10px', marginBottom: 6, borderRadius: 14, border: 'none', background: idx === i ? C.mint : C.inner, color: idx === i ? '#10261c' : C.text, fontWeight: 700, fontSize: 16, textAlign: 'left' }}
          >
            <span>{idx + 1}. {n}</span>
            <span style={{ fontSize: 13 }}>{idx === i ? 'Now' : idx < i ? 'Done' : ''}</span>
          </button>
        ))}
      </div>

      {wk.group === 'Kegel' && (
        <p style={{ color: C.sub, fontSize: 13, marginTop: 16 }}>
          Gently lift and squeeze the pelvic floor. Keep breathing, and do not tighten abs, thighs or glutes.
          General wellness guidance, not medical advice. Stop if it hurts, and ask a doctor if symptoms persist.
        </p>
      )}
    </div>
  );
}

export default function WorkoutBrowser() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('All groups');
  const [type, setType] = useState('All Exercises');
  const [open, setOpen] = useState<string | null>(null);
  const [prem, setPrem] = useState(isPremium());
  const [ad, setAd] = useState<{ name: string; left: number } | null>(null);
  const [session, setSession] = useState<W | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!ad) return;
    const id = window.setTimeout(() => {
      if (ad.left <= 1) {
        unlockExercise(ad.name); // 12 hours
        setOpen(ad.name);
        setAd(null);
      } else {
        setAd({ name: ad.name, left: ad.left - 1 });
      }
    }, 1000);
    return () => window.clearTimeout(id);
  }, [ad]);

  const list = WORKOUTS.filter(
    (x) =>
      (group === 'All groups' || x.group === group) &&
      (type === 'All Exercises' || x.type === type) &&
      (q.trim() === '' || x.name.toLowerCase().includes(q.trim().toLowerCase()))
  );

  const buyPremium = () => {
    // TEST ONLY: real payment comes later
    setPremium(true);
    setPrem(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '8px 0 20px' }}>
      <div style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: 28, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 999, border: '2px solid ' + C.mint, display: 'grid', placeItems: 'center', color: C.mint }}>
            <Dumbbell size={24} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Find a workout</div>
            <div style={{ color: C.sub, fontSize: 16 }}>{list.length} {prem ? 'Categories' : 'Premium Categories'}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.inner, border: '1px solid ' + C.line, borderRadius: 18, padding: '0 14px' }}>
          <Search size={20} color={C.sub} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories... e.g. Yoga, HIIT, Kegel"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 16, padding: '16px 0' }}
          />
        </div>

        <div style={{ color: C.sub, fontWeight: 700, margin: '16px 0 8px' }}>Group</div>
        <div style={row}>
          {GROUPS.map((g) => (
            <button key={g} onClick={() => setGroup(g)} style={chip(group === g)}>{g}</button>
          ))}
        </div>

        <div style={{ color: C.sub, fontWeight: 700, margin: '16px 0 8px' }}>Exercise type</div>
        <div style={row}>
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} style={chip(type === t)}>{t}</button>
          ))}
        </div>
      </div>

      {list.length === 0 && (
        <div style={{ color: C.sub, textAlign: 'center', padding: 20 }}>Kuch nahi mila. Filter badlo.</div>
      )}

      {list.map((x) => {
        const adOk = AD_NAMES.has(x.name);
        const left = unlockLeft(x.name);
        const unlocked = prem || (adOk && left > 0);
        return (
          <div key={x.name} style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: 28, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flex: '0 0 auto', width: 52, height: 52, borderRadius: 999, border: '2px solid ' + C.mint, display: 'grid', placeItems: 'center', color: C.mint }}>
                <Dumbbell size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 21, fontWeight: 800, color: C.text }}>{x.name}</div>
                  {!prem && (
                    unlocked ? (
                      <div style={{ flex: '0 0 auto', background: C.mint, color: '#10261c', borderRadius: 999, padding: '6px 12px', fontWeight: 800, fontSize: 13 }}>
                        {fmtLeft(left)} left
                      </div>
                    ) : adOk ? (
                      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, background: C.mint, color: '#10261c', borderRadius: 999, padding: '6px 12px', fontWeight: 800, fontSize: 13 }}>
                        <Lock size={14} /> Free with ad
                      </div>
                    ) : (
                      <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, background: '#d6b254', color: '#2b2108', borderRadius: 999, padding: '6px 12px', fontWeight: 800, fontSize: 14 }}>
                        <Lock size={14} /> Premium
                      </div>
                    )
                  )}
                </div>
                <div style={{ color: C.sub, fontSize: 15, marginTop: 4 }}>
                  {x.group} • {x.level} • {x.min} min • {x.ex.length} exercises
                </div>
                <div style={{ height: 8, borderRadius: 999, background: C.inner, marginTop: 12 }}>
                  <div style={{ height: 8, borderRadius: 999, background: C.gold, width: Math.min(100, (x.min / 30) * 100) + '%' }} />
                </div>
              </div>
            </div>

            {open === x.name && (
              <div style={{ marginTop: 14, background: C.inner, borderRadius: 18, padding: 14, color: C.text }}>
                {x.ex.map((e, i) => {
                  const it = itemFor(e);
                  return (
                    <div key={i} style={{ padding: '8px 0', borderBottom: i < x.ex.length - 1 ? '1px solid ' + C.line : 'none' }}>
                      <div style={{ fontWeight: 700 }}>{i + 1}. {e}</div>
                      {unlocked && it && (
                        <div style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{it.muscles.join(' · ')}</div>
                      )}
                    </div>
                  );
                })}
                {x.group === 'Kegel' && (
                  <div style={{ color: C.sub, fontSize: 13, marginTop: 8 }}>General wellness guidance, not medical advice.</div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => setOpen(open === x.name ? null : x.name)}
                style={{ flex: 1, padding: '18px 0', borderRadius: 999, border: 'none', background: C.inner, color: C.text, fontWeight: 800, fontSize: 17 }}
              >
                Preview
              </button>
              {unlocked ? (
                <button
                  onClick={() => setSession(x)}
                  style={{ flex: 1.3, padding: '18px 0', borderRadius: 999, border: 'none', background: C.mint, color: '#10261c', fontWeight: 800, fontSize: 17 }}
                >
                  Start
                </button>
              ) : adOk ? (
                <button
                  onClick={() => setAd({ name: x.name, left: 5 })}
                  style={{ flex: 1.3, padding: '18px 0', borderRadius: 999, border: 'none', background: C.mint, color: '#10261c', fontWeight: 800, fontSize: 16 }}
                >
                  Watch ad to unlock
                </button>
              ) : (
                <button
                  onClick={buyPremium}
                  style={{ flex: 1.3, padding: '18px 0', borderRadius: 999, border: 'none', background: C.gold, color: '#20190a', fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Crown size={18} /> Unlock with Premium
                </button>
              )}
            </div>
          </div>
        );
      })}

      {ad && (
        <div style={{ ...overlay, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 56 }}>📺</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Ad playing (demo)</div>
          <div style={{ color: C.sub }}>{ad.left}s baad workout 12 ghante ke liye unlock hoga</div>
        </div>
      )}

      {session && <Session wk={session} onClose={() => setSession(null)} />}
    </div>
  );
}
