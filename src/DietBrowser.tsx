import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Search, Lock, Crown, Utensils } from 'lucide-react';
import { isPremium, setPremium } from './access';
import { logMeal, unlogMeal, useToday } from './NutritionSnapshot';

/* ------------------------------------------------------------------
   DIET BROWSER (v2)
   Category -> Subcategory -> Diet -> full day plan (8 meals).
   Every meal is built from a small food list, and portions are scaled
   to the diet's calories. Totals are added up from the foods.
   Preview (free) = name + calories only. Full plan = Premium only.
------------------------------------------------------------------- */

// ==DATA-START==
type SlotKey = 'bf' | 'mid' | 'lunch' | 'eve' | 'pre' | 'post' | 'dinner' | 'bed';

const SLOTS: { k: SlotKey; name: string; time: string; pct: number }[] = [
  { k: 'bf', name: 'Breakfast', time: '8:00 AM', pct: 20 },
  { k: 'mid', name: 'Mid Morning Meal', time: '11:00 AM', pct: 8 },
  { k: 'lunch', name: 'Lunch', time: '1:30 PM', pct: 27 },
  { k: 'eve', name: 'Evening Snacks', time: '4:30 PM', pct: 8 },
  { k: 'pre', name: 'Pre Workout Meal', time: '5:30 PM', pct: 7 },
  { k: 'post', name: 'Post Workout Meal', time: '7:30 PM', pct: 8 },
  { k: 'dinner', name: 'Dinner', time: '8:30 PM', pct: 18 },
  { k: 'bed', name: 'Bedtime Meal', time: '10:00 PM', pct: 4 },
];

// n = name, k = kcal per unit, p/c/f = grams per unit, u = unit label,
// s = smallest step, g = grams per unit (if set, shown in grams), m = max servings
type Food = { n: string; k: number; p: number; c: number; f: number; u: string; s: number; g?: number; m?: number };

const FOODS: Record<string, Food> = {
  roti: { n: 'Roti (wheat)', k: 100, p: 3, c: 18, f: 1, u: 'pc', s: 1, m: 4 },
  jowar: { n: 'Jowar roti', k: 95, p: 3, c: 19, f: 1, u: 'pc', s: 1, m: 4 },
  rice: { n: 'Brown rice (cooked)', k: 215, p: 5, c: 45, f: 2, u: 'cup', s: 0.5, m: 2 },
  poha: { n: 'Vegetable poha', k: 180, p: 4, c: 32, f: 4, u: 'cup', s: 0.5, m: 2 },
  oats: { n: 'Oats', k: 115, p: 4, c: 20, f: 2, u: 'g', s: 0.5, g: 30, m: 3 },
  idli: { n: 'Idli', k: 60, p: 2, c: 12, f: 0, u: 'pc', s: 1, m: 4 },
  toast: { n: 'Multigrain toast', k: 80, p: 3, c: 14, f: 1, u: 'slice', s: 1, m: 3 },
  dal: { n: 'Dal / sambar', k: 150, p: 9, c: 22, f: 3, u: 'katori', s: 0.5, m: 1.5 },
  rajma: { n: 'Rajma', k: 170, p: 10, c: 28, f: 1, u: 'katori', s: 0.5, m: 1.5 },
  chole: { n: 'Chole', k: 190, p: 10, c: 27, f: 5, u: 'katori', s: 0.5, m: 1.5 },
  sprouts: { n: 'Moong sprouts', k: 80, p: 7, c: 12, f: 1, u: 'katori', s: 0.5, m: 1.5 },
  chana: { n: 'Roasted chana', k: 110, p: 6, c: 18, f: 2, u: 'g', s: 0.5, g: 30, m: 2 },
  mchilla: { n: 'Moong dal chilla', k: 90, p: 5, c: 12, f: 2, u: 'pc', s: 1, m: 3 },
  bchilla: { n: 'Besan chilla', k: 100, p: 5, c: 11, f: 4, u: 'pc', s: 1, m: 3 },
  sattu: { n: 'Sattu drink', k: 105, p: 6, c: 18, f: 2, u: 'glass', s: 0.5, m: 1.5 },
  paneer: { n: 'Paneer', k: 135, p: 9, c: 1, f: 10, u: 'g', s: 1, g: 50, m: 3 },
  curd: { n: 'Curd', k: 60, p: 4, c: 5, f: 3, u: 'katori', s: 0.5, m: 2 },
  milk: { n: 'Milk (toned)', k: 120, p: 7, c: 10, f: 6, u: 'glass', s: 0.5, m: 2 },
  whey: { n: 'Whey protein', k: 120, p: 24, c: 3, f: 2, u: 'scoop', s: 0.5, m: 1.5 },
  tofu: { n: 'Tofu', k: 80, p: 9, c: 2, f: 5, u: 'g', s: 0.5, g: 100, m: 2 },
  soya: { n: 'Soya chunks (dry)', k: 85, p: 13, c: 8, f: 0, u: 'g', s: 1, g: 25, m: 3 },
  soymilk: { n: 'Soy milk', k: 100, p: 7, c: 6, f: 4, u: 'glass', s: 0.5, m: 2 },
  buttermilk: { n: 'Buttermilk', k: 40, p: 2, c: 4, f: 2, u: 'glass', s: 1, m: 2 },
  egg: { n: 'Egg (whole)', k: 75, p: 6, c: 1, f: 5, u: 'pc', s: 1, m: 4 },
  eggw: { n: 'Egg white', k: 17, p: 4, c: 0, f: 0, u: 'pc', s: 1, m: 6 },
  chickbr: { n: 'Grilled chicken', k: 165, p: 31, c: 0, f: 4, u: 'g', s: 0.5, g: 100, m: 2.5 },
  chickcur: { n: 'Chicken curry', k: 220, p: 20, c: 6, f: 12, u: 'katori', s: 0.5, m: 1.5 },
  fish: { n: 'Fish (rohu / surmai)', k: 140, p: 20, c: 1, f: 5, u: 'g', s: 0.5, g: 100, m: 2 },
  sabzi: { n: 'Mixed veg sabzi', k: 90, p: 3, c: 10, f: 4, u: 'katori', s: 0.5, m: 2 },
  salad: { n: 'Salad', k: 35, p: 2, c: 7, f: 0, u: 'plate', s: 1, m: 1 },
  soup: { n: 'Vegetable soup', k: 60, p: 2, c: 10, f: 2, u: 'bowl', s: 1, m: 1 },
  banana: { n: 'Banana', k: 105, p: 1, c: 27, f: 0, u: 'pc', s: 1, m: 2 },
  apple: { n: 'Apple', k: 95, p: 0, c: 25, f: 0, u: 'pc', s: 1, m: 2 },
  dates: { n: 'Dates', k: 28, p: 0, c: 8, f: 0, u: 'pc', s: 1, m: 6 },
  almonds: { n: 'Almonds', k: 7, p: 0.3, c: 0.3, f: 0.6, u: 'pcs', s: 1, m: 12 },
  peanuts: { n: 'Roasted peanuts', k: 57, p: 3, c: 2, f: 5, u: 'tbsp', s: 1, m: 3 },
  pbutter: { n: 'Peanut butter', k: 95, p: 4, c: 3, f: 8, u: 'tbsp', s: 1, m: 2 },
  walnut: { n: 'Walnut', k: 50, p: 1, c: 1, f: 5, u: 'pc', s: 1, m: 3 },
  makhana: { n: 'Roasted makhana', k: 70, p: 2, c: 14, f: 0, u: 'handful', s: 1, m: 2 },
  coconutw: { n: 'Coconut water', k: 45, p: 2, c: 9, f: 0, u: 'glass', s: 1, m: 1 },
  chia: { n: 'Chia seeds', k: 60, p: 2, c: 5, f: 4, u: 'tbsp', s: 1, m: 2 },
  chai: { n: 'Masala chai (low sugar)', k: 60, p: 2, c: 8, f: 2, u: 'cup', s: 1, m: 1 },
};

// [food id, share of the meal's calories]
type Tpl = [string, number][];

const VEG_T: Record<SlotKey, Tpl[]> = {
  bf: [
    [['poha', 0.65], ['milk', 0.35]],
    [['mchilla', 0.7], ['curd', 0.3]],
    [['bchilla', 0.55], ['paneer', 0.25], ['curd', 0.2]],
    [['oats', 0.5], ['milk', 0.3], ['almonds', 0.2]],
    [['idli', 0.6], ['dal', 0.4]],
  ],
  mid: [
    [['apple', 0.6], ['almonds', 0.4]],
    [['buttermilk', 0.5], ['makhana', 0.5]],
    [['sprouts', 1]],
    [['coconutw', 0.5], ['apple', 0.5]],
    [['curd', 0.6], ['chia', 0.4]],
  ],
  lunch: [
    [['roti', 0.4], ['dal', 0.3], ['sabzi', 0.15], ['salad', 0.05], ['curd', 0.1]],
    [['rice', 0.4], ['rajma', 0.4], ['salad', 0.1], ['curd', 0.1]],
    [['paneer', 0.35], ['roti', 0.35], ['sabzi', 0.2], ['salad', 0.1]],
    [['jowar', 0.4], ['sabzi', 0.25], ['dal', 0.35]],
    [['chole', 0.4], ['rice', 0.35], ['salad', 0.1], ['curd', 0.15]],
  ],
  eve: [
    [['chana', 0.8], ['chai', 0.2]],
    [['sprouts', 0.8], ['salad', 0.2]],
    [['makhana', 0.7], ['chai', 0.3]],
    [['banana', 0.55], ['pbutter', 0.45]],
    [['soup', 0.6], ['toast', 0.4]],
  ],
  pre: [
    [['banana', 0.7], ['dates', 0.3]],
    [['toast', 0.5], ['pbutter', 0.5]],
    [['oats', 0.6], ['milk', 0.4]],
    [['poha', 1]],
    [['apple', 0.5], ['almonds', 0.5]],
  ],
  post: [
    [['whey', 0.55], ['banana', 0.45]],
    [['paneer', 0.6], ['banana', 0.4]],
    [['curd', 0.5], ['banana', 0.3], ['chia', 0.2]],
    [['sattu', 0.6], ['banana', 0.4]],
    [['sprouts', 0.5], ['milk', 0.5]],
  ],
  dinner: [
    [['roti', 0.35], ['paneer', 0.3], ['sabzi', 0.2], ['salad', 0.15]],
    [['dal', 0.4], ['rice', 0.35], ['curd', 0.25]],
    [['soup', 0.25], ['dal', 0.3], ['sabzi', 0.25], ['roti', 0.2]],
    [['tofu', 0.35], ['sabzi', 0.3], ['roti', 0.35]],
    [['bchilla', 0.5], ['sabzi', 0.2], ['curd', 0.3]],
  ],
  bed: [
    [['milk', 1]],
    [['almonds', 0.7], ['walnut', 0.3]],
    [['curd', 1]],
    [['milk', 0.7], ['dates', 0.3]],
    [['curd', 0.5], ['almonds', 0.5]],
  ],
};

const NV_T: Record<SlotKey, Tpl[]> = {
  bf: [
    [['egg', 0.6], ['toast', 0.4]],
    [['egg', 0.55], ['roti', 0.45]],
    [['egg', 0.5], ['toast', 0.3], ['banana', 0.2]],
    [['oats', 0.5], ['milk', 0.2], ['egg', 0.3]],
    [['eggw', 0.3], ['poha', 0.7]],
  ],
  mid: [
    [['apple', 0.6], ['almonds', 0.4]],
    [['egg', 0.6], ['salad', 0.4]],
    [['buttermilk', 0.5], ['chana', 0.5]],
    [['curd', 0.5], ['apple', 0.5]],
    [['coconutw', 0.5], ['apple', 0.5]],
  ],
  lunch: [
    [['chickbr', 0.4], ['rice', 0.4], ['salad', 0.1], ['sabzi', 0.1]],
    [['chickcur', 0.4], ['roti', 0.4], ['salad', 0.1], ['curd', 0.1]],
    [['fish', 0.35], ['rice', 0.35], ['sabzi', 0.2], ['salad', 0.1]],
    [['egg', 0.3], ['roti', 0.35], ['sabzi', 0.2], ['salad', 0.15]],
    [['chickbr', 0.35], ['dal', 0.2], ['roti', 0.3], ['salad', 0.15]],
  ],
  eve: [
    [['egg', 1]],
    [['soup', 0.5], ['chickbr', 0.5]],
    [['chana', 0.7], ['chai', 0.3]],
    [['eggw', 0.5], ['salad', 0.5]],
    [['sprouts', 0.6], ['egg', 0.4]],
  ],
  pre: [
    [['banana', 0.7], ['dates', 0.3]],
    [['toast', 0.5], ['pbutter', 0.5]],
    [['oats', 0.6], ['milk', 0.4]],
    [['egg', 0.4], ['banana', 0.6]],
    [['apple', 0.5], ['almonds', 0.5]],
  ],
  post: [
    [['whey', 0.55], ['banana', 0.45]],
    [['egg', 0.6], ['banana', 0.4]],
    [['chickbr', 0.6], ['toast', 0.4]],
    [['chickbr', 0.5], ['curd', 0.5]],
    [['egg', 0.6], ['roti', 0.4]],
  ],
  dinner: [
    [['fish', 0.4], ['sabzi', 0.3], ['roti', 0.3]],
    [['chickbr', 0.35], ['soup', 0.2], ['sabzi', 0.2], ['roti', 0.25]],
    [['egg', 0.35], ['sabzi', 0.3], ['roti', 0.35]],
    [['chickbr', 0.4], ['salad', 0.2], ['dal', 0.4]],
    [['chickbr', 0.4], ['sabzi', 0.3], ['rice', 0.3]],
  ],
  bed: [
    [['milk', 1]],
    [['curd', 1]],
    [['milk', 0.6], ['almonds', 0.4]],
    [['milk', 0.7], ['dates', 0.3]],
    [['almonds', 0.5], ['curd', 0.5]],
  ],
};

const VEGAN_T: Record<SlotKey, Tpl> = {
  bf: [['tofu', 0.5], ['toast', 0.5]],
  mid: [['apple', 0.5], ['peanuts', 0.5]],
  lunch: [['rajma', 0.4], ['rice', 0.35], ['salad', 0.1], ['sabzi', 0.15]],
  eve: [['chana', 0.8], ['apple', 0.2]],
  pre: [['banana', 0.7], ['dates', 0.3]],
  post: [['soymilk', 0.5], ['banana', 0.5]],
  dinner: [['soya', 0.3], ['sabzi', 0.3], ['roti', 0.4]],
  bed: [['soymilk', 1]],
};

type DType = 'Veg only' | 'Non-veg' | 'Veg + Non-veg';

type Diet = {
  name: string;
  cat: string;
  sub: string;
  type: DType;
  kcal: number; // target
  pick: number;
  note: string;
};

const d = (name: string, cat: string, sub: string, type: DType, kcal: number, pick: number, note: string): Diet => ({
  name, cat, sub, type, kcal, pick, note,
});

const DIETS: Diet[] = [
  // FAT LOSS
  d('Indian Veg Fat Loss', 'Fat loss', 'Vegetarian', 'Veg only', 1400, 0, 'Keep oil to about 1 tsp per meal and finish dinner 2-3 hours before sleep.'),
  d('High Protein Veg Cut', 'Fat loss', 'Vegetarian', 'Veg only', 1600, 2, 'Paneer, curd, dal and sprouts keep protein high while calories stay low.'),
  d('Indian Non-veg Fat Loss', 'Fat loss', 'Non-veg', 'Non-veg', 1500, 1, 'Prefer grilled, steamed or light-oil curries.'),
  d('Chicken & Fish Cut', 'Fat loss', 'Non-veg', 'Non-veg', 1700, 3, 'Lean chicken and fish give protein with fewer calories.'),
  d('Low Carb Veg', 'Fat loss', 'Low carb', 'Veg only', 1400, 4, 'Choose more sabzi, paneer and dal, and smaller portions of rice and roti.'),
  d('Low Carb Non-veg', 'Fat loss', 'Low carb', 'Non-veg', 1500, 2, 'Fill half your plate with vegetables and salad.'),
  // MUSCLE
  d('Veg Muscle Gain', 'Muscle', 'Vegetarian', 'Veg only', 2600, 0, 'Spread paneer, curd, dal and soya through the day to build protein.'),
  d('Paneer & Soya Mass', 'Muscle', 'Vegetarian', 'Veg only', 2800, 2, 'Add a protein source to every meal, including snacks.'),
  d('Non-veg Muscle Gain', 'Muscle', 'Non-veg', 'Non-veg', 2800, 1, 'Spread protein evenly across meals instead of one big serving.'),
  d('Egg & Chicken Mass', 'Muscle', 'Non-veg', 'Non-veg', 3000, 3, 'Eggs and chicken are easy, affordable protein sources.'),
  d('Lean Bulk Veg', 'Muscle', 'Lean bulk', 'Veg only', 2400, 4, 'A small calorie surplus keeps weight gain mostly lean.'),
  d('Lean Bulk Non-veg', 'Muscle', 'Lean bulk', 'Veg + Non-veg', 2400, 0, 'Track your weight weekly and adjust portions slowly.'),
  // PERFORMANCE
  d('Gym Beginner Veg', 'Performance', 'Beginner', 'Veg only', 2000, 1, 'A simple, steady plan to build the habit first.'),
  d('Gym Beginner Non-veg', 'Performance', 'Beginner', 'Veg + Non-veg', 2200, 2, 'Keep meals regular and do not skip breakfast.'),
  d('Athlete Fuel Veg', 'Performance', 'Athlete', 'Veg only', 2700, 3, 'Carbs before and after training support energy and recovery.'),
  d('Athlete Fuel Non-veg', 'Performance', 'Athlete', 'Veg + Non-veg', 2900, 4, 'Eat enough on heavy training days to support strength.'),
  d('Endurance Runner Veg', 'Performance', 'Endurance', 'Veg only', 2500, 0, 'Add a banana or dates before long runs for quick carbs.'),
  d('Endurance Runner Non-veg', 'Performance', 'Endurance', 'Veg + Non-veg', 2700, 1, 'Drink water through the day and add salt on long, hot runs.'),
  // HEALTH
  d('Balanced Indian Vegetarian', 'Health', 'Balanced', 'Veg only', 1900, 2, 'Flexible everyday meals with dal, vegetables, grains and curd.'),
  d('Balanced Non-veg', 'Health', 'Balanced', 'Non-veg', 2000, 3, 'Mix fish, eggs and chicken through the week.'),
  d('Heart Healthy', 'Health', 'Heart healthy', 'Veg + Non-veg', 1800, 4, 'Use less salt and fried food, more fibre, nuts and fish.'),
  d('Low Glycemic Indian', 'Health', 'Low glycemic', 'Veg only', 1800, 3, 'Choose millets, dal and vegetables over refined flour and sugar.'),
  d('Vegan Plant Based', 'Health', 'Plant based', 'Veg only', 1900, 0, 'Plan protein from soya, tofu and dal, and check vitamin B12 with a doctor.'),
  d('Healthy Weight Gain', 'Health', 'Weight gain', 'Veg + Non-veg', 2500, 0, 'Add calorie-dense foods like nuts, banana and milk.'),
];

const CATS = ['All goals', 'Fat loss', 'Muscle', 'Performance', 'Health'];

type MealItem = { n: string; q: string; kcal: number };
type Meal = { name: string; time: string; kcal: number; p: number; c: number; f: number; items: MealItem[] };
type Plan = { meals: Meal[]; kcal: number; p: number; c: number; f: number };

const fmt = (n: number) => String(Math.round(n * 10) / 10);

const cache: Record<string, Plan> = {};

function build(x: Diet, scale: number): Plan {
  let tk = 0, tp = 0, tc = 0, tf = 0;
  const meals: Meal[] = SLOTS.map((s, i) => {
    let tpl: Tpl;
    if (x.sub === 'Plant based') {
      tpl = VEGAN_T[s.k];
    } else {
      const nv = x.type === 'Non-veg' || (x.type === 'Veg + Non-veg' && (s.k === 'lunch' || s.k === 'post' || s.k === 'dinner'));
      const src = nv ? NV_T : VEG_T;
      tpl = src[s.k][(x.pick + i) % src[s.k].length];
    }
    const target = ((x.kcal * s.pct) / 100) * scale;
    let mk = 0, mp = 0, mc = 0, mf = 0;
    const items = tpl.map(([id, share]) => {
      const f = FOODS[id];
      let qty = Math.max(f.s, Math.round((target * share) / f.k / f.s) * f.s);
      if (f.m && qty > f.m) qty = f.m;
      const kcal = qty * f.k;
      mk += kcal;
      mp += qty * f.p;
      mc += qty * f.c;
      mf += qty * f.f;
      tp += qty * f.p;
      tc += qty * f.c;
      tf += qty * f.f;
      return { n: f.n, q: f.g ? Math.round(qty * f.g) + ' g' : fmt(qty) + ' ' + f.u, kcal: Math.round(kcal) };
    });
    tk += mk;
    return { name: s.name, time: s.time, kcal: Math.round(mk), p: Math.round(mp), c: Math.round(mc), f: Math.round(mf), items };
  });
  return { meals, kcal: Math.round(tk / 10) * 10, p: Math.round(tp), c: Math.round(tc), f: Math.round(tf) };
}

function planFor(x: Diet): Plan {
  if (cache[x.name]) return cache[x.name];
  // Portions come in whole steps, so try a few scales and keep the closest to the target.
  let best = build(x, 1);
  let scale = 1;
  for (let i = 0; i < 12; i++) {
    const cur = build(x, scale);
    if (Math.abs(cur.kcal - x.kcal) < Math.abs(best.kcal - x.kcal)) best = cur;
    if (Math.abs(cur.kcal - x.kcal) <= x.kcal * 0.03) break;
    scale = scale * (x.kcal / cur.kcal) * (i % 2 === 0 ? 0.97 : 1.03);
  }
  cache[x.name] = best;
  return best;
}
// ==DATA-END==

const C = {
  card: '#223a2f',
  inner: '#1b3027',
  line: '#2e4b3d',
  gold: '#cdaa4e',
  mint: '#8fd6b4',
  text: '#ffffff',
  sub: '#a9bfb3',
};

const chip = (on: boolean): CSSProperties => ({
  flex: '0 0 auto',
  padding: '9px 16px',
  borderRadius: 999,
  border: '1px solid ' + (on ? C.mint : C.line),
  background: on ? C.mint : 'transparent',
  color: on ? '#10261c' : C.text,
  fontWeight: 700,
  fontSize: 14,
});

const row: CSSProperties = { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 };
const label: CSSProperties = { color: C.sub, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: '14px 0 8px' };

export default function DietBrowser() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All goals');
  const [sub, setSub] = useState('All');
  const [open, setOpen] = useState<string | null>(null);
  const [prem, setPrem] = useState(isPremium());
  const today = useToday();

  const subs: string[] = [];
  DIETS.forEach((x) => {
    if (x.cat === cat && subs.indexOf(x.sub) < 0) subs.push(x.sub);
  });

  const list = DIETS.filter((x) => {
    const s = q.trim().toLowerCase();
    return (
      (cat === 'All goals' || x.cat === cat) &&
      (sub === 'All' || x.sub === sub) &&
      (s === '' ||
        x.name.toLowerCase().includes(s) ||
        x.cat.toLowerCase().includes(s) ||
        x.sub.toLowerCase().includes(s) ||
        x.type.toLowerCase().includes(s))
    );
  });

  const pickCat = (c: string) => {
    setCat(c);
    setSub('All');
  };

  const buyPremium = () => {
    // TEST ONLY: real payment comes later
    setPremium(true);
    setPrem(true);
  };

  let lastGroup = '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '8px 0 20px' }}>
      {/* One slim premium strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.card, border: '1px solid ' + C.line, borderRadius: 20, padding: '12px 14px' }}>
        <div style={{ flex: '0 0 auto', width: 38, height: 38, borderRadius: 999, background: C.inner, display: 'grid', placeItems: 'center', color: C.gold }}>
          <Crown size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 16 }}>{DIETS.length} diet plans</div>
          <div style={{ color: C.sub, fontSize: 13 }}>
            {prem ? 'Premium active. Tap a plan to open it.' : 'Free: name and calories. Full plans in Premium.'}
          </div>
        </div>
        {!prem && (
          <button
            onClick={buyPremium}
            style={{ flex: '0 0 auto', padding: '10px 16px', borderRadius: 999, border: 'none', background: C.gold, color: '#20190a', fontWeight: 800, fontSize: 14 }}
          >
            Get Premium
          </button>
        )}
      </div>

      {/* Search + category + subcategory */}
      <div style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: 24, padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.inner, borderRadius: 16, padding: '0 14px' }}>
          <Search size={18} color={C.sub} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search diets..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 16, padding: '14px 0' }}
          />
        </div>

        <div style={label}>Category</div>
        <div style={row}>
          {CATS.map((c) => (
            <button key={c} onClick={() => pickCat(c)} style={chip(cat === c)}>{c}</button>
          ))}
        </div>

        {cat !== 'All goals' && (
          <>
            <div style={label}>Subcategory</div>
            <div style={row}>
              {['All'].concat(subs).map((s) => (
                <button key={s} onClick={() => setSub(s)} style={chip(sub === s)}>{s}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {list.length === 0 && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ color: C.sub, marginBottom: 12 }}>Kuch nahi mila.</div>
          <button
            onClick={() => { setQ(''); pickCat('All goals'); }}
            style={{ padding: '10px 18px', borderRadius: 999, border: '1px solid ' + C.line, background: 'transparent', color: C.text, fontWeight: 700 }}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Diet cards, grouped */}
      {list.map((x) => {
        const isOpen = open === x.name;
        const plan = planFor(x);
        const group = cat === 'All goals' ? x.cat : x.sub;
        const showHead = group !== lastGroup;
        lastGroup = group;
        return (
          <div key={x.name} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {showHead && (
              <div style={{ color: C.gold, fontWeight: 800, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', padding: '6px 4px 0' }}>
                {group}
              </div>
            )}
            <div style={{ background: C.card, border: '1px solid ' + C.line, borderRadius: 22, overflow: 'hidden' }}>
              <button
                onClick={() => setOpen(isOpen ? null : x.name)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', textAlign: 'left', color: C.text }}
              >
                <div style={{ flex: '0 0 auto', width: 42, height: 42, borderRadius: 999, border: '2px solid ' + C.mint, display: 'grid', placeItems: 'center', color: C.mint }}>
                  <Utensils size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{x.name}</div>
                  <div style={{ color: C.sub, fontSize: 13, marginTop: 2 }}>{x.cat} • {x.sub} • {x.type}</div>
                </div>
                <div style={{ flex: '0 0 auto', textAlign: 'right' }}>
                  <div style={{ color: C.gold, fontWeight: 800, fontSize: 17 }}>{plan.kcal}</div>
                  <div style={{ color: C.sub, fontSize: 11 }}>kcal/day</div>
                </div>
                {!prem && <Lock size={16} color={C.sub} style={{ flex: '0 0 auto' }} />}
              </button>

              {isOpen && !prem && (
                <div style={{ padding: '0 16px 16px' }}>
                  <div style={{ background: C.inner, borderRadius: 16, padding: 14, textAlign: 'center' }}>
                    <div style={{ color: C.sub, fontSize: 14, marginBottom: 12 }}>
                      Full day plan with 8 meals is in Premium. Ad se unlock nahi hota.
                    </div>
                    <button
                      onClick={buyPremium}
                      style={{ padding: '12px 22px', borderRadius: 999, border: 'none', background: C.gold, color: '#20190a', fontWeight: 800, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      <Crown size={16} /> Unlock with Premium
                    </button>
                  </div>
                </div>
              )}

              {isOpen && prem && (
                <div style={{ padding: '0 16px 16px' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    {[['Protein', plan.p], ['Carbs', plan.c], ['Fat', plan.f]].map((r) => (
                      <div key={String(r[0])} style={{ flex: 1, background: C.inner, borderRadius: 14, padding: '8px 6px', textAlign: 'center' }}>
                        <div style={{ color: C.sub, fontSize: 12 }}>{r[0]}</div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{r[1]} g</div>
                      </div>
                    ))}
                  </div>
                  {plan.meals.map((ml, i) => (
                    <div key={ml.name} style={{ padding: '10px 0', borderBottom: i < plan.meals.length - 1 ? '1px solid ' + C.line : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                        <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>
                          {ml.name} <span style={{ color: C.sub, fontWeight: 500, fontSize: 12 }}>· {ml.time}</span>
                        </div>
                        <div style={{ color: C.gold, fontWeight: 700, fontSize: 13 }}>{ml.kcal} kcal</div>
                      </div>
                      {ml.items.map((it) => (
                        <div key={it.n} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: C.sub, fontSize: 14, marginTop: 3 }}>
                          <span>{it.n}</span>
                          <span style={{ color: C.text }}>{it.q}</span>
                        </div>
                      ))}
                      {(() => {
                        const e = today.entries[ml.name];
                        const done = !!e && e.diet === x.name;
                        return (
                          <button
                            onClick={() =>
                              done
                                ? unlogMeal(ml.name)
                                : logMeal(ml.name, { kcal: ml.kcal, p: ml.p, c: ml.c, f: ml.f, diet: x.name }, { name: x.name, kcal: plan.kcal, p: plan.p })
                            }
                            style={{
                              marginTop: 10,
                              padding: '9px 16px',
                              borderRadius: 999,
                              border: '1px solid ' + C.mint,
                              background: done ? C.mint : 'transparent',
                              color: done ? '#10261c' : C.mint,
                              fontWeight: 800,
                              fontSize: 13,
                            }}
                          >
                            {done ? 'Logged ✓  (tap to undo)' : 'Log this meal'}
                          </button>
                        );
                      })()}
                    </div>
                  ))}
                  <div style={{ color: C.mint, fontSize: 13, marginTop: 8, fontWeight: 700 }}>Tip: {x.note}</div>
                  <div style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>
                    Approximate values. General wellness guidance, not medical advice. If you have a health condition, ask a doctor or dietitian.
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
