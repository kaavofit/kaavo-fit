
export type Gating =
  | 'FREE_10AD_2HR'
  | 'WATER_1AD_TILL_12'
  | 'AD_1HR'
  | 'AD_5MAX'
  | 'AD_1_ONLY'
  | 'AD_10_1MONTH'
  | 'PREMIUM'
  | 'REFER_1DAY';

export interface Feature {
  id: string;
  section: string;
  hi: string;
  en: string;
  gating: Gating;
}

export const SECTIONS = [
  { id: 'shuruwat', title: '1. Shuruwat' },
  { id: 'daily', title: '2. Daily Core' },
  { id: 'workout', title: '3. Workout' },
  { id: 'diet', title: '4. Khana / Diet' },
  { id: 'tracking', title: '5. Tracking' },
  { id: 'growth', title: '6. Sabse Last - Paisa / Growth' },
];

export const FEATURES: Feature[] = [
  // SECTION 1 — SHURUWAAT
  {
    id: 'challenge',
    section: 'shuruwat',
    hi: '7 Din Challenge',
    en: '7 Day Challenge',
    gating: 'FREE_10AD_2HR',
  },

  // SECTION 2 — DAILY CORE
  {
    id: 'aaj',
    section: 'daily',
    hi: 'Aaj Ka Plan',
    en: 'Today’s Plan',
    gating: 'FREE_10AD_2HR',
  },
  {
    id: 'streak',
    section: 'daily',
    hi: 'Daily Streak Fire',
    en: 'Daily Streak Fire',
    gating: 'FREE_10AD_2HR',
  },
  {
    id: 'rest',
    section: 'daily',
    hi: 'Rest Timer + Beep',
    en: 'Rest Timer + Beep',
    gating: 'FREE_10AD_2HR',
  },
  {
    id: 'water',
    section: 'daily',
    hi: 'Paani Reminder',
    en: 'Water Reminder',
    gating: 'WATER_1AD_TILL_12',
  },
  {
    id: 'sleep',
    section: 'daily',
    hi: 'Sleep Tracker',
    en: 'Sleep Tracker',
    gating: 'WATER_1AD_TILL_12',
  },
  {
    id: 'walk',
    section: 'daily',
    hi: 'Walk Tracker',
    en: 'Walk Tracker',
    gating: 'WATER_1AD_TILL_12',
  },

  // SECTION 3 — WORKOUT
  {
    id: 'five',
    section: 'workout',
    hi: '5 Minute Workout',
    en: '5 Minute Workout',
    gating: 'FREE_10AD_2HR',
  },
  {
    id: 'custom',
    section: 'workout',
    hi: 'Apna Workout Banao',
    en: 'Custom Workout',
    gating: 'AD_5MAX',
  },
  {
    id: 'dard',
    section: 'workout',
    hi: 'Kamar / Ghutna Dard Mode',
    en: 'Back / Knee Pain Mode',
    gating: 'AD_1HR',
  },
  {
    id: 'recovery',
    section: 'workout',
    hi: 'Dard Ke Baad Recovery',
    en: 'Recovery After Pain',
    gating: 'AD_1HR',
  },

  // SECTION 4 — KHANA / DIET
  {
    id: 'scanner',
    section: 'diet',
    hi: 'Ghar Ka Khana Scanner',
    en: 'Home Food Scanner',
    gating: 'PREMIUM',
  },
  {
    id: 'ghar',
    section: 'diet',
    hi: 'Ghar Me Kya Hai?',
    en: 'What Is at Home?',
    gating: 'PREMIUM',
  },
  {
    id: 'budget',
    section: 'diet',
    hi: 'Budget Diet',
    en: 'Budget Diet',
    gating: 'PREMIUM',
  },
  {
    id: 'festival',
    section: 'diet',
    hi: 'Festival Diet',
    en: 'Festival Diet',
    gating: 'AD_1_ONLY',
  },
  {
    id: 'paani',
    section: 'diet',
    hi: 'Paani Smart Reminder',
    en: 'Smart Water Reminder',
    gating: 'AD_1HR',
  },

  // SECTION 5 — TRACKING
  {
    id: 'weight',
    section: 'tracking',
    hi: 'Weight Graph',
    en: 'Weight Graph',
    gating: 'FREE_10AD_2HR',
  },
  {
    id: 'photo',
    section: 'tracking',
    hi: 'Photo Pehle / Baad',
    en: 'Before / After Photos',
    gating: 'FREE_10AD_2HR',
  },
  {
    id: 'mood',
    section: 'tracking',
    hi: 'Mood Tracker',
    en: 'Mood Tracker',
    gating: 'FREE_10AD_2HR',
  },
  {
    id: 'period',
    section: 'tracking',
    hi: 'Period / Cycle Tracker',
    en: 'Period / Cycle Tracker',
    gating: 'AD_10_1MONTH',
  },
  {
    id: 'badge',
    section: 'tracking',
    hi: 'Badge Wall',
    en: 'Badge Wall',
    gating: 'FREE_10AD_2HR',
  },

  // SECTION 6 — GROWTH
  {
    id: 'refer',
    section: 'growth',
    hi: 'Refer & Earn',
    en: 'Refer & Earn',
    gating: 'REFER_1DAY',
  },
];
