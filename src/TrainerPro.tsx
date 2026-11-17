import { useEffect, useState } from 'react';
import { EXS, Figure, KegelGuide } from './Trainer3D';
import type { Tab } from './Trainer3D';
import { canUse, isPremium, setPremium, unlockExercise, unlockLeft, fmtLeft, resetAccess } from './access';

type Props = {
  running: boolean;
  speed: number;
  view: any;
  onRep?: (...a: any[]) => void;
  resetKey?: any;
};

export default function TrainerPro(props: Props) {
  const [tab, setTab] = useState<Tab>('home');
  const [exId, setExId] = useState('squat');
  const [adLeft, setAdLeft] = useState(0);
  const [, setTick] = useState(0);
  const refresh = () => setTick((x) => x + 1);

  const ex = EXS.find((e) => e.id === exId) || EXS[0];
  const list = EXS.filter((e) => e.tab === tab);
  const prem = isPremium();
  const ok = canUse(ex.tab, ex.id);
  const left = unlockLeft(ex.id);

  useEffect(() => {
    const id = window.setInterval(refresh, 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (adLeft <= 0) return;
    const id = window.setTimeout(() => {
      if (adLeft === 1) unlockExercise(ex.id);
      setAdLeft(adLeft - 1);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [adLeft]);

  const pickTab = (t: Tab) => {
    if (adLeft > 0) return;
    setTab(t);
    const f = EXS.find((e) => e.tab === t);
    if (f) setExId(f.id);
  };
  const pickEx = (id: string) => {
    if (adLeft > 0) return;
    setExId(id);
  };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.12)',
    background: active ? '#8fd5b4' : 'rgba(255,255,255,0.06)',
    color: active ? '#0f2a20' : '#cfe3d9',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  });

  const bigBtn: React.CSSProperties = {
    padding: '12px 20px',
    borderRadius: 14,
    border: 'none',
    background: '#8fd5b4',
    color: '#0f2a20',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  };

  const lockBox = (children: React.ReactNode) => (
    <div
      style={{
        height: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        textAlign: 'center',
        padding: '0 20px',
        color: '#e8f5ee',
      }}
    >
      {children}
    </div>
  );

  let body: React.ReactNode;
  if (adLeft > 0) {
    body = lockBox(
      <>
        <div style={{ fontSize: 40 }}>📺</div>
        <div style={{ fontWeight: 700 }}>Ad playing (demo)</div>
        <div style={{ opacity: 0.7 }}>{adLeft}s</div>
      </>
    );
  } else if (!ok) {
    body = lockBox(
      <>
        <div style={{ fontSize: 40 }}>🔒</div>
        {ex.tab === 'home' ? (
          <>
            <div style={{ fontWeight: 700 }}>{ex.name} is locked</div>
            <div style={{ opacity: 0.7, fontSize: 14 }}>Watch one short ad to unlock this exercise for 12 hours.</div>
            <button type="button" style={bigBtn} onClick={() => setAdLeft(5)}>
              Watch ad to unlock
            </button>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700 }}>Premium feature</div>
            <div style={{ opacity: 0.7, fontSize: 14 }}>
              {ex.tab === 'gym' ? 'All gym exercises are' : 'Kegel exercises are'} part of KAAVO Premium.
            </div>
            <button
              type="button"
              style={bigBtn}
              onClick={() => {
                setPremium(true);
                refresh();
              }}
            >
              Get Premium (test)
            </button>
          </>
        )}
      </>
    );
  } else if (ex.kegel) {
    body = (
      <>
        <KegelGuide
          key={ex.id}
          running={props.running}
          speed={props.speed}
          onRep={props.onRep}
          resetKey={props.resetKey}
          steps={ex.kegel}
        />
        <p style={{ fontSize: 12, opacity: 0.7, color: '#cfe3d9', margin: '6px 2px 0' }}>
          Gently lift and squeeze the pelvic floor. Keep breathing, and do not tighten abs, thighs or glutes.
          Illustrative guide, not medical advice. Stop if it hurts, and ask a doctor if symptoms persist.
        </p>
      </>
    );
  } else {
    body = <Figure ex={ex} {...props} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, padding: '2px 0 8px' }}>
        {(['home', 'gym', 'kegel'] as Tab[]).map((t) => (
          <button key={t} type="button" style={chip(tab === t)} onClick={() => pickTab(t)}>
            {t === 'home' ? 'Home' : t === 'gym' ? 'Gym' : 'Kegel'}
            {t !== 'home' && !prem ? ' 🔒' : ''}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0 8px' }}>
        {list.map((e) => (
          <button key={e.id} type="button" style={chip(exId === e.id)} onClick={() => pickEx(e.id)}>
            {e.name}
            {canUse(e.tab, e.id) ? '' : ' 🔒'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: '0 0 8px' }}>
        <b style={{ color: '#e8f5ee', marginRight: 4 }}>{ex.name}</b>
        {ex.muscles.map((m) => (
          <span
            key={m}
            style={{
              fontSize: 12,
              padding: '3px 9px',
              borderRadius: 999,
              background: 'rgba(255,60,60,0.16)',
              border: '1px solid rgba(255,90,90,0.5)',
              color: '#ff9a9a',
            }}
          >
            {m}
          </span>
        ))}
      </div>
      {ok && !prem && ex.tab === 'home' && left > 0 && (
        <div style={{ fontSize: 12, color: '#8fd5b4', padding: '0 0 6px' }}>Unlocked · {fmtLeft(left)} left</div>
      )}
      {body}
      <div style={{ display: 'flex', gap: 8, paddingTop: 10, opacity: 0.6 }}>
        <button
          type="button"
          style={{ ...chip(false), fontSize: 11 }}
          onClick={() => {
            setPremium(!prem);
            refresh();
          }}
        >
          Test: Premium {prem ? 'ON' : 'OFF'}
        </button>
        <button
          type="button"
          style={{ ...chip(false), fontSize: 11 }}
          onClick={() => {
            resetAccess();
            refresh();
          }}
        >
          Test: reset locks
        </button>
      </div>
    </div>
  );
}
