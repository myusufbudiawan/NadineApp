import * as Crypto from 'expo-crypto';
import { LOCAL_BABY_ID } from '@/features/baby-profile/constants';
import { BabyProfile } from '@/features/baby-profile/types';
import { CareEventData, CareEventType } from '@/features/care-events/types';
import { MilestoneId } from '@/features/milestones/types';
import { secureStoreAdapter } from '@/lib/auth/session';
import {
  getDatabase,
  insertCareEvent,
  insertGrowthMeasurement,
  insertReminder,
  resetLocalData,
  saveProfile,
  upsertMilestone,
} from '@/lib/offline/database';

// Sample data for the web demo (lib/offlineOnly.ts WEB_DEMO): a baby born
// at 31+2 weeks, seven weeks into the NICU journey. Everything is dated
// relative to "now" so the dashboard always looks live. A couple of
// milestones are deliberately left just out of reach so visitors can trigger
// a celebration themselves: logging a weight of 2 kg or more ("Reached 2
// kg"), or one more decent feed today ("Drinking like a full-term baby").

const DAY = 86_400_000;
const HOUR = 3_600_000;
const SEEDED_KEY = 'preemietrack.demoSeeded';

const AGE_DAYS = 49;
const BIRTH_WEIGHT_KG = 1.32;

// Deterministic jitter so every visitor sees the same demo.
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

// Day 0..5 early weight loss, back to birth weight by day 12, then steady
// gain — tops out just under 2 kg yesterday.
function weightOnDay(day: number) {
  if (day <= 5) return BIRTH_WEIGHT_KG - 0.02 * day;
  if (day <= 12) return BIRTH_WEIGHT_KG - 0.1 + (0.1 / 7) * (day - 5);
  return BIRTH_WEIGHT_KG + 0.018 * (day - 12);
}

export async function isDemoSeeded(): Promise<boolean> {
  return (await secureStoreAdapter.getItem(SEEDED_KEY)) === '1';
}

let inFlight: Promise<void> | undefined;

// app/index.tsx's launch effect can re-run while a seed is still going;
// overlapping runs would nest SQLite transactions, so they share one.
export function seedDemoData(): Promise<void> {
  inFlight ??= writeDemoData().finally(() => {
    inFlight = undefined;
  });
  return inFlight;
}

async function writeDemoData(): Promise<void> {
  const now = Date.now();
  const birth = new Date(now - AGE_DAYS * DAY);
  birth.setHours(4, 12, 0, 0);
  const birthMs = birth.getTime();
  const at = (day: number, hour: number, minute = 0) => {
    const d = new Date(birthMs + day * DAY);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  const random = makeRandom(31);

  const profile: BabyProfile = {
    id: LOCAL_BABY_ID,
    name: 'Aria',
    sex: 'girl',
    dateOfBirth: birth.toISOString(),
    gestationalWeeks: 31,
    gestationalDays: 2,
    birthWeightKg: BIRTH_WEIGHT_KG,
    birthLengthCm: 39.5,
    birthHeadCircumferenceCm: 28,
    fullTermReferenceWeeks: 40,
  };

  const events: { type: CareEventType; when: Date; data: CareEventData; notes?: string }[] = [];
  const add = (type: CareEventType, when: Date, data: CareEventData, notes?: string) => {
    if (when.getTime() <= now) events.push({ type, when, data, notes });
  };
  const recentStart = now - 3 * DAY;

  // Weights every other morning from birth, ending yesterday at 1.97 kg.
  for (let day = 0; day < AGE_DAYS - 1; day += 2) {
    const kg = weightOnDay(day) + (random() - 0.5) * 0.01;
    add('weight', at(day, 7, 30), { value: Math.round(kg * 1000) / 1000, unit: 'kg' });
  }
  add('weight', at(AGE_DAYS - 1, 7, 30), { value: 1.97, unit: 'kg' });

  // Three-hourly feeds over the last three days. ~275 ml a day — just shy of
  // the ~150 ml/kg/day "full-term volume" milestone.
  for (let t = Math.ceil(recentStart / (3 * HOUR)) * 3 * HOUR; t <= now; t += 3 * HOUR) {
    const when = new Date(t + Math.round(random() * 20) * 60_000);
    const breast = random() < 0.4;
    add('feeding', when, {
      method: breast ? 'Breastmilk' : 'Bottle',
      amount: 32 + Math.round(random() * 4),
      unit: 'ml',
    });
  }

  // Diapers, about seven a day.
  for (let t = recentStart + HOUR; t <= now; t += 3.4 * HOUR) {
    const r = random();
    add('diaper', new Date(t), {
      diaperType: r < 0.6 ? 'Wet' : r < 0.85 ? 'Dirty' : 'Both',
    });
  }

  // Sleep stretches between feeds.
  for (let t = recentStart + 0.5 * HOUR; t + 2 * HOUR <= now; t += 6 * HOUR) {
    const start = new Date(t);
    const end = new Date(t + (1.5 + random() * 1.2) * HOUR);
    add('sleep', start, { startAt: start.toISOString(), endAt: end.toISOString() });
  }

  for (let day = AGE_DAYS - 3; day <= AGE_DAYS; day++) {
    for (const hour of [8, 20]) {
      add('temperature', at(day, hour, 15), {
        value: Math.round((36.6 + random() * 0.4) * 10) / 10,
        unit: 'C',
        method: 'Axillary',
      });
    }
    const vitD = at(day, 9);
    add('medication', vitD, {
      medicationName: 'Vitamin D',
      dose: 400,
      unit: 'IU',
      scheduledAt: vitD.toISOString(),
    });
    const iron = at(day, 18);
    add('medication', iron, {
      medicationName: 'Iron supplement',
      dose: 0.5,
      unit: 'ml',
      scheduledAt: iron.toISOString(),
    });
  }

  // Kangaroo care: the first cuddle on day 4, then most days.
  const kangarooDays = [4, 8, 11, 15, 19, 22, 26, 30, 33, 37, 40, 43, 45, 46, 47, 48, 49];
  for (const day of kangarooDays) {
    const start = at(day, 14, 30);
    const minutes = day === 4 ? 25 : 60 + Math.round(random() * 30);
    add('kangaroo', start, {
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + minutes * 60_000).toISOString(),
    });
  }

  add('note', at(4, 15, 10), {}, 'First cuddle today. She settled straight away on my chest.');
  add('note', at(22, 11, 0), {}, 'First bottle! Took 8 ml before getting tired. So proud.');
  add('note', at(34, 10, 30), {}, 'Moved to an open cot — no more incubator.');
  add(
    'note',
    at(AGE_DAYS - 1, 16, 45),
    {},
    'Nurse says if she keeps gaining like this we could start talking about going home.',
  );

  const milestones: [MilestoneId, Date][] = [
    ['first-cuddle', at(4, 14, 30)],
    ['off-cpap', at(6, 10)],
    ['regained-birth-weight', at(12, 7, 30)],
    ['off-high-flow', at(15, 9)],
    ['first-oral-feed', at(22, 11)],
    ['room-air', at(27, 13)],
    ['open-cot', at(34, 10, 30)],
  ];

  const growth: { metric: 'length' | 'headCircumference'; value: number; unit: 'cm'; when: Date }[] =
    [];
  for (let week = 0; week * 7 < AGE_DAYS; week++) {
    const when = at(week * 7, 8);
    growth.push({ metric: 'length', value: Math.round((39.5 + week * 0.9) * 10) / 10, unit: 'cm', when });
    growth.push({
      metric: 'headCircumference',
      value: Math.round((28 + week * 0.75) * 10) / 10,
      unit: 'cm',
      when,
    });
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const reminders = [
    { type: 'medication', title: 'Vitamin D drops', timeOfDay: '09:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    { type: 'medication', title: 'Iron supplement', timeOfDay: '18:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    { type: 'measurement', title: 'Weigh-in', timeOfDay: '07:30', daysOfWeek: [1, 4] },
  ];

  const database = await getDatabase();
  await database.withTransactionAsync(async () => {
    await resetLocalData();
    await saveProfile(LOCAL_BABY_ID, JSON.stringify(profile));
    for (const e of events) {
      await insertCareEvent({
        id: Crypto.randomUUID(),
        babyId: LOCAL_BABY_ID,
        type: e.type,
        occurredAt: e.when.toISOString(),
        data: e.data,
        notes: e.notes,
      });
    }
    for (const g of growth) {
      await insertGrowthMeasurement({
        id: Crypto.randomUUID(),
        babyId: LOCAL_BABY_ID,
        metric: g.metric,
        value: g.value,
        unit: g.unit,
        measuredAt: g.when.toISOString(),
      });
    }
    for (const [milestoneId, achievedAt] of milestones) {
      await upsertMilestone({
        milestoneId,
        babyId: LOCAL_BABY_ID,
        achievedAt: achievedAt.toISOString(),
        celebrated: true,
      });
    }
    for (const r of reminders) {
      await insertReminder({ id: Crypto.randomUUID(), babyId: LOCAL_BABY_ID, timezone, enabled: true, ...r });
    }
  });
  await secureStoreAdapter.setItem(SEEDED_KEY, '1');
}

