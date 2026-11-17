import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type Props = {
  running: boolean;
  speed: number;
  view: any;
  onRep?: (...a: any[]) => void;
  resetKey?: any;
};

export type Tab = 'home' | 'gym' | 'kegel';
type Part = 'legs' | 'glutes' | 'torso' | 'arms';

type Pose = {
  root: number; rootZ: number; hy: number; hz: number;
  torso: number; head: number;
  armX: number; armZ: number; elbowX: number; elbowZ: number;
  A: [number, number]; S: [number, number];
  thZ: number; footK: number;
};

export type Ex = {
  id: string; tab: Tab; name: string; muscles: string[]; parts: Part[];
  secs: number; side?: boolean; low?: boolean; db?: boolean; cz?: number;
  pose?: (d: number, P: Pose) => void;
  kegel?: [string, number][];
};

const L1 = 0.45, L2 = 0.45, FOOT = 0.05;

const cl = (v: number) => Math.max(-1, Math.min(1, v));

const ik = (tz: number, tyd: number) => {
  const dist = Math.min(Math.hypot(tz, tyd), L1 + L2 - 0.002);
  const phi = Math.atan2(tz, tyd);
  const gam = Math.acos(cl((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist)));
  const del = Math.acos(cl((L2 * L2 + dist * dist - L1 * L1) / (2 * L2 * dist)));
  return { A: phi + gam, S: phi - del };
};

const blank = (): Pose => ({
  root: 0, rootZ: 0, hy: L1 + L2 + FOOT, hz: 0,
  torso: 0, head: 0,
  armX: 0, armZ: 0.06, elbowX: 0, elbowZ: 0,
  A: [0, 0], S: [0, 0], thZ: 0, footK: 0,
});

const planted = (P: Pose) => {
  P.hy = L1 * Math.cos(P.A[0]) + L2 * Math.cos(P.S[0]) + FOOT;
  P.hz = -(L1 * Math.sin(P.A[0]) + L2 * Math.sin(P.S[0]));
};

export const EXS: Ex[] = [
  {
    id: 'squat', tab: 'home', name: 'Squat',
    muscles: ['Quads', 'Glutes', 'Hamstrings'], parts: ['legs', 'glutes'], secs: 3,
    pose: (d, P) => {
      const c = d * 1.35, b = d * 0.75;
      P.A = [c, c]; P.S = [-b, -b];
      planted(P);
      P.torso = d * 0.55; P.head = -P.torso * 0.7;
      P.armX = -d * 1.5 - P.torso;
    },
  },
  {
    id: 'pushup', tab: 'home', name: 'Push-up',
    muscles: ['Chest', 'Shoulders', 'Triceps', 'Core'], parts: ['torso', 'arms'],
    secs: 3, side: true, low: true,
    pose: (d, P) => {
      const al = 1.2 * d;
      const h = 0.28 * Math.cos(al) + 0.31;
      const th = Math.acos(Math.min(h / 1.45, 1));
      P.root = th; P.rootZ = -0.7;
      P.armX = al - th; P.elbowX = -al; P.head = -0.45;
    },
  },
  {
    id: 'lunge', tab: 'home', name: 'Lunge',
    muscles: ['Quads', 'Glutes', 'Hamstrings'], parts: ['legs', 'glutes'],
    secs: 3, side: true,
    pose: (d, P) => {
      const hy = 0.95 - 0.3 * d;
      const sz = 0.12 + 0.26 * d;
      const f = ik(sz, hy - FOOT);
      const k = ik(-sz, hy - FOOT);
      P.A = [k.A, f.A]; P.S = [k.S, f.S];
      P.hy = hy; P.hz = 0;
      P.torso = 0.08 * d; P.armX = -0.15; P.elbowX = -0.5;
    },
  },
  {
    id: 'plank', tab: 'home', name: 'Plank',
    muscles: ['Core', 'Shoulders'], parts: ['torso', 'arms'],
    secs: 4, side: true, low: true,
    pose: (d, P) => {
      const th = 1.33 + 0.01 * d;
      P.root = th; P.rootZ = -0.7;
      P.armX = -th; P.elbowX = -Math.PI / 2; P.head = -0.4;
    },
  },
  {
    id: 'bridge', tab: 'home', name: 'Glute bridge',
    muscles: ['Glutes', 'Hamstrings', 'Core'], parts: ['glutes', 'legs', 'torso'],
    secs: 3, side: true, low: true, cz: -0.35,
    pose: (d, P) => {
      const hh = 0.14 + 0.3 * d;
      P.root = -Math.PI / 2; P.hy = 0; P.hz = hh;
      const k = ik(FOOT - hh, 0.55);
      P.A = [k.A, k.A]; P.S = [k.S, k.S];
      P.torso = -Math.asin(Math.min((0.3 * d) / 0.5, 1));
      P.footK = 1; P.armZ = 0.12;
    },
  },
  {
    id: 'jack', tab: 'home', name: 'Jumping jack',
    muscles: ['Shoulders', 'Calves', 'Quads'], parts: ['arms', 'legs'], secs: 2,
    pose: (d, P) => {
      const lg = 0.38 * d;
      P.armZ = 0.1 + 2.8 * d; P.thZ = lg;
      P.hy = (L1 + L2) * Math.cos(lg) + FOOT;
    },
  },
  {
    id: 'press', tab: 'gym', name: 'Shoulder press',
    muscles: ['Shoulders', 'Triceps'], parts: ['arms'], secs: 3, db: true,
    pose: (d, P) => {
      const ph = 1.5 + 1.4 * d;
      P.armZ = ph; P.elbowZ = Math.PI - ph;
    },
  },
  {
    id: 'curl', tab: 'gym', name: 'Bicep curl',
    muscles: ['Biceps'], parts: ['arms'], secs: 3, db: true,
    pose: (d, P) => {
      P.armX = 0.05; P.elbowX = -2.2 * d;
    },
  },
  {
    id: 'lateral', tab: 'gym', name: 'Lateral raise',
    muscles: ['Side delts'], parts: ['arms'], secs: 3, db: true,
    pose: (d, P) => {
      P.armZ = 0.1 + 1.4 * d;
    },
  },
  {
    id: 'deadlift', tab: 'gym', name: 'Deadlift',
    muscles: ['Hamstrings', 'Glutes', 'Lower back'], parts: ['legs', 'glutes', 'torso'],
    secs: 4, db: true, side: true,
    pose: (d, P) => {
      const tl = 1.25 * d;
      const hy = 0.93 - 0.08 * d, hz = -0.28 * d;
      const k = ik(-hz, hy - FOOT);
      P.A = [k.A, k.A]; P.S = [k.S, k.S];
      P.hy = hy; P.hz = hz;
      P.torso = tl; P.head = -tl * 0.6; P.armX = -tl;
    },
  },
  {
    id: 'kegel-hold', tab: 'kegel', name: 'Kegel hold',
    muscles: ['Pelvic floor'], parts: [], secs: 9,
    kegel: [['Squeeze', 3], ['Hold', 3], ['Relax', 3]],
  },
  {
    id: 'kegel-quick', tab: 'kegel', name: 'Quick flicks',
    muscles: ['Pelvic floor'], parts: [], secs: 2,
    kegel: [['Squeeze', 1], ['Relax', 1]],
  },
];

type FigProps = Props & { ex: Ex };

export function Figure(props: FigProps) {
  const box = useRef<HTMLDivElement>(null);
  const live = useRef(props);
  live.current = props;

  useEffect(() => {
    const el = box.current!;
    const H = 300;
    const W = () => el.clientWidth || 300;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(36, W() / H, 0.1, 50);
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.setSize(W(), H);
    el.appendChild(r.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(2, 4, 3);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xaaccff, 0.5);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    const mk = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 });
    const skin = mk(0xf3c6a5);
    const shirtT = mk(0x1f4d3a);
    const shirtA = mk(0x1f4d3a);
    const legsM = mk(0x16181c);
    const glutesM = mk(0x16181c);
    const shoe = mk(0xffffff);
    const hairM = mk(0x3a2218);
    const tieM = mk(0x1f4d3a);
    const floorM = mk(0x2b3340);
    const dbMat = mk(0x22262c);
    const eyeM = new THREE.MeshBasicMaterial({ color: 0x2a1a12 });
    const whiteM = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const mouthM = new THREE.MeshBasicMaterial({ color: 0x7a2e2e });
    const blushM = new THREE.MeshBasicMaterial({ color: 0xf08a80, transparent: true, opacity: 0.55 });
    const hl: Record<Part, THREE.MeshStandardMaterial> = {
      legs: legsM, glutes: glutesM, torso: shirtT, arms: shirtA,
    };

    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.3, 48), floorM);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const ball = (rad: number, mat: THREE.Material) =>
      new THREE.Mesh(new THREE.SphereGeometry(rad, 24, 16), mat);
    const seg = (rt: number, rb: number, len: number, mat: THREE.Material) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, len, 24), mat);
      m.position.y = -len / 2;
      return m;
    };
    const makeDb = () => {
      const g = new THREE.Group();
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 10), dbMat);
      bar.rotation.z = Math.PI / 2;
      g.add(bar);
      [-1, 1].forEach((k) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.035, 16), dbMat);
        w.rotation.z = Math.PI / 2;
        w.position.x = k * 0.07;
        g.add(w);
      });
      g.visible = false;
      return g;
    };

    const root = new THREE.Group();
    scene.add(root);
    const hip = new THREE.Group();
    root.add(hip);

    const pelvis = ball(0.15, glutesM);
    pelvis.scale.set(1, 0.9, 0.78);
    pelvis.position.y = -0.04;
    hip.add(pelvis);

    const torso = new THREE.Group();
    hip.add(torso);

    const shell = new THREE.Group();
    shell.scale.set(1, 1, 0.75);
    torso.add(shell);
    const prof = [
      [0.0, -0.02], [0.15, -0.02], [0.147, 0.05], [0.125, 0.18], [0.118, 0.24],
      [0.13, 0.32], [0.137, 0.38], [0.135, 0.44], [0.128, 0.5], [0.1, 0.54],
      [0.05, 0.57], [0.0, 0.57],
    ].map((p) => new THREE.Vector2(p[0], p[1]));
    shell.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 36), shirtT));

    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 128;
    const g2 = cv.getContext('2d')!;
    g2.fillStyle = '#ffffff';
    g2.font = 'bold 84px Arial, sans-serif';
    g2.textAlign = 'center';
    g2.textBaseline = 'middle';
    g2.fillText('KAAVO', 256, 64);
    const tex = new THREE.CanvasTexture(cv);
    const logo = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1385, 0.1385, 0.045, 16, 1, true, -0.5, 1.0),
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      })
    );
    logo.position.y = 0.4;
    shell.add(logo);

    const neck = seg(0.04, 0.045, 0.12, skin);
    neck.position.y = 0.64;
    torso.add(neck);

    const headG = new THREE.Group();
    headG.position.y = 0.73;
    torso.add(headG);
    const headM = ball(0.125, skin);
    headM.scale.y = 1.05;
    headG.add(headM);
    [-1, 1].forEach((s) => {
      const eye = ball(0.026, eyeM);
      eye.scale.set(1, 1.3, 0.5);
      eye.position.set(s * 0.048, -0.008, 0.108);
      const shine = ball(0.007, whiteM);
      shine.position.set(s * 0.048 + 0.008, 0.004, 0.121);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.009, 0.01), hairM);
      brow.position.set(s * 0.048, 0.037, 0.103);
      brow.rotation.z = s * -0.12;
      const cheek = ball(0.022, blushM);
      cheek.scale.z = 0.3;
      cheek.position.set(s * 0.075, -0.04, 0.095);
      headG.add(eye, shine, brow, cheek);
    });
    const nose = ball(0.012, skin);
    nose.position.set(0, -0.028, 0.121);
    headG.add(nose);
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.005, 8, 16, Math.PI), mouthM);
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.052, 0.113);
    headG.add(smile);

    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.133, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairM
    );
    cap.scale.y = 1.05;
    cap.rotation.x = -0.45;
    headG.add(cap);
    const back = ball(0.125, hairM);
    back.scale.set(1, 1.0, 0.8);
    back.position.set(0, 0.015, -0.03);
    headG.add(back);

    const pony = new THREE.Group();
    pony.position.set(0, 0.075, -0.115);
    pony.rotation.x = 0.3;
    pony.add(ball(0.04, hairM));
    pony.add(seg(0.04, 0.012, 0.34, hairM));
    const tie = ball(0.022, tieM);
    tie.position.y = -0.015;
    pony.add(tie);
    headG.add(pony);

    const arms: THREE.Group[] = [];
    const elbows: THREE.Group[] = [];
    const dbs: THREE.Group[] = [];
    [-1, 1].forEach((s) => {
      const arm = new THREE.Group();
      arm.position.set(s * 0.16, 0.5, 0);
      arm.add(ball(0.052, shirtA), seg(0.046, 0.04, 0.28, shirtA));
      const elbow = new THREE.Group();
      elbow.position.y = -0.28;
      elbow.add(ball(0.04, shirtA), seg(0.04, 0.034, 0.25, shirtA));
      const hand = ball(0.038, skin);
      hand.position.y = -0.27;
      elbow.add(hand);
      const dbl = makeDb();
      dbl.position.y = -0.27;
      elbow.add(dbl);
      arm.add(elbow);
      torso.add(arm);
      arms.push(arm);
      elbows.push(elbow);
      dbs.push(dbl);
    });

    const thighs: THREE.Group[] = [];
    const shins: THREE.Group[] = [];
    const feet: THREE.Group[] = [];
    [-1, 1].forEach((s) => {
      const th = new THREE.Group();
      th.position.set(s * 0.085, 0, 0);
      th.add(ball(0.09, legsM), seg(0.09, 0.064, L1, legsM));
      const sh = new THREE.Group();
      sh.position.y = -L1;
      sh.add(ball(0.064, legsM), seg(0.064, 0.044, L2, legsM));
      const ankle = ball(0.046, legsM);
      ankle.position.y = -L2;
      sh.add(ankle);
      const ft = new THREE.Group();
      ft.position.set(0, -L2, 0.05);
      const geo = new THREE.CapsuleGeometry(0.05, 0.14, 6, 16);
      geo.rotateX(Math.PI / 2);
      const shoeM = new THREE.Mesh(geo, shoe);
      shoeM.scale.set(1, 0.85, 1);
      ft.add(shoeM);
      sh.add(ft);
      th.add(sh);
      hip.add(th);
      thighs.push(th);
      shins.push(sh);
      feet.push(ft);
    });

    let last = performance.now();
    let phase = 0;
    let reps = 0;
    let key = live.current.resetKey;
    let curId = live.current.ex.id;
    let raf = 0;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const p = live.current;
      const ex = p.ex;

      if (p.resetKey !== key || ex.id !== curId) {
        key = p.resetKey;
        curId = ex.id;
        phase = 0;
        reps = 0;
      }
      if (p.running) {
        phase += dt * (Number(p.speed) || 1) * ((Math.PI * 2) / ex.secs);
        const n = Math.floor(phase / (Math.PI * 2));
        if (n > reps) {
          reps = n;
          if (p.onRep) p.onRep();
        }
      }
      const d = (1 - Math.cos(phase)) / 2;

      const P = blank();
      if (ex.pose) ex.pose(d, P);

      root.rotation.x = P.root;
      root.position.z = P.rootZ;
      hip.position.set(0, P.hy, P.hz);
      torso.rotation.x = P.torso;
      headG.rotation.x = P.head;
      pony.rotation.x = 0.3 + d * 0.2;
      for (let i = 0; i < 2; i++) {
        const s = i === 0 ? -1 : 1;
        arms[i].rotation.set(P.armX, 0, s * P.armZ);
        elbows[i].rotation.set(P.elbowX, 0, s * P.elbowZ);
        thighs[i].rotation.set(-P.A[i], 0, s * P.thZ);
        shins[i].rotation.x = -P.S[i] + P.A[i];
        feet[i].rotation.set(P.S[i] - P.root * P.footK, 0, -s * P.thZ);
      }

      (Object.keys(hl) as Part[]).forEach((k) => {
        hl[k].emissive.setHex(0xff2a2a);
        hl[k].emissiveIntensity = ex.parts.includes(k) ? 0.15 + 0.6 * d : 0;
      });
      dbs.forEach((x) => (x.visible = !!ex.db));

      const v = (ex.side ? 'side' : String(p.view)).toLowerCase();
      const ty = ex.low ? 0.5 : 0.95;
      const cz = ex.cz || 0;
      const dist = ex.low ? 4.2 : 3.4;
      if (v.includes('side')) cam.position.set(dist, ty + 0.05, cz);
      else if (v.includes('back')) cam.position.set(0, ty + 0.05, -dist);
      else cam.position.set(1.0, ty + 0.15, dist - 0.1);
      cam.lookAt(0, ty, cz);
      r.render(scene, cam);
    };
    raf = requestAnimationFrame(loop);

    const onResize = () => {
      r.setSize(W(), H);
      cam.aspect = W() / H;
      cam.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene.traverse((o: any) => {
        if (o.geometry) o.geometry.dispose();
      });
      tex.dispose();
      r.dispose();
      if (r.domElement.parentNode === el) el.removeChild(r.domElement);
    };
  }, []);

  return <div ref={box} style={{ width: '100%', height: 300, borderRadius: 16, overflow: 'hidden' }} />;
}

type KegelProps = {
  running: boolean;
  speed: number;
  onRep?: (...a: any[]) => void;
  resetKey?: any;
  steps: [string, number][];
};

export function KegelGuide(props: KegelProps) {
  const [t, setT] = useState(0);
  const live = useRef(props);
  live.current = props;
  const tRef = useRef(0);
  const repRef = useRef(0);
  const keyRef = useRef(props.resetKey);

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
        repRef.current = 0;
      }
      if (p.running) {
        tRef.current += dt * (Number(p.speed) || 1);
        const total = p.steps.reduce((a, s) => a + s[1], 0);
        const n = Math.floor(tRef.current / total);
        if (n > repRef.current) {
          repRef.current = n;
          if (p.onRep) p.onRep();
        }
      }
      setT(tRef.current);
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  const total = props.steps.reduce((a, s) => a + s[1], 0);
  const tt = t % total;
  let acc = 0;
  let label = '';
  let left = 0;
  let prog = 0;
  for (const s of props.steps) {
    if (tt < acc + s[1]) {
      label = s[0];
      prog = (tt - acc) / s[1];
      left = Math.ceil(acc + s[1] - tt);
      break;
    }
    acc += s[1];
  }
  let scale = 1;
  if (props.running) {
    if (label === 'Squeeze') scale = 1 - 0.45 * prog;
    else if (label === 'Hold') scale = 0.55;
    else scale = 0.55 + 0.45 * prog;
  }

  return (
    <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed rgba(148,214,181,0.35)' }} />
        <div
          style={{
            width: 150, height: 150, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, #b7efd3, #3f9d78)',
            transform: `scale(${scale})`,
            boxShadow: '0 0 40px rgba(148,214,181,0.35)',
            transition: 'transform 0.06s linear',
          }}
        />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#e8f5ee' }}>{props.running ? label : 'Ready'}</div>
      <div style={{ opacity: 0.7, color: '#cfe3d9' }}>{props.running ? `${left}s` : 'Press Start'}</div>
    </div>
  );
}

export default function Trainer3D(props: Props) {
  const [tab, setTab] = useState<Tab>('home');
  const [exId, setExId] = useState('squat');
  const ex = EXS.find((e) => e.id === exId) || EXS[0];
  const list = EXS.filter((e) => e.tab === tab);

  const pick = (t: Tab) => {
    setTab(t);
    const f = EXS.find((e) => e.tab === t);
    if (f) setExId(f.id);
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

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, padding: '2px 0 8px' }}>
        {(['home', 'gym', 'kegel'] as Tab[]).map((t) => (
          <button key={t} type="button" style={chip(tab === t)} onClick={() => pick(t)}>
            {t === 'home' ? 'Home' : t === 'gym' ? 'Gym' : 'Kegel'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0 8px' }}>
        {list.map((e) => (
          <button key={e.id} type="button" style={chip(exId === e.id)} onClick={() => setExId(e.id)}>
            {e.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: '0 0 8px' }}>
        <b style={{ color: '#e8f5ee', marginRight: 4 }}>{ex.name}</b>
        {ex.muscles.map((m) => (
          <span
            key={m}
            style={{
              fontSize: 12, padding: '3px 9px', borderRadius: 999,
              background: 'rgba(255,60,60,0.16)', border: '1px solid rgba(255,90,90,0.5)', color: '#ff9a9a',
            }}
          >
            {m}
          </span>
        ))}
      </div>
      {ex.kegel ? (
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
      ) : (
        <Figure ex={ex} {...props} />
      )}
    </div>
  );
}
