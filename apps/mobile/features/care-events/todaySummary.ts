import { listCareEventsSince } from '@/lib/offline/database';
import { loadCareEventHistory } from './storage';
import { DiaperData, FeedingData, KangarooCareData, SleepData, WeightData } from './types';

export type TodaySummary = {
  weight: { hasAny: boolean; value?: number; unit?: string; deltaCaption?: string };
  feeding: { hasAny: boolean; todayCount: number; lastAmount?: number; lastUnit?: string };
  sleep: { hasAny: boolean; todayTotalMinutes: number };
  diaper: { hasAny: boolean; todayCount: number; wet: number; dirty: number };
  kangaroo: { hasAny: boolean; todayTotalMinutes: number; todayCount: number };
};

function startOfTodayIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export async function computeTodaySummary(babyId: string): Promise<TodaySummary> {
  const since = startOfTodayIso();
  const todayRows = await listCareEventsSince(babyId, since);
  const todayByType = <T,>(type: string) =>
    todayRows.filter((r) => r.type === type).map((r) => JSON.parse(r.data) as T);

  const weightHistory = await loadCareEventHistory(babyId, 'weight');
  const latestWeight = weightHistory[0]?.data as WeightData | undefined;
  const previousWeight = weightHistory[1]?.data as WeightData | undefined;
  const weight: TodaySummary['weight'] = { hasAny: Boolean(latestWeight) };
  if (latestWeight) {
    weight.value = latestWeight.value;
    weight.unit = latestWeight.unit;
    if (previousWeight && previousWeight.unit === latestWeight.unit) {
      const delta = latestWeight.value - previousWeight.value;
      const sign = delta >= 0 ? '+' : '';
      weight.deltaCaption = `${sign}${delta.toFixed(2)} ${latestWeight.unit} vs last reading`;
    } else {
      weight.deltaCaption = 'Latest reading';
    }
  }

  const todayFeedings = todayByType<FeedingData>('feeding');
  const feedingHistory = await loadCareEventHistory(babyId, 'feeding');
  const lastFeeding = feedingHistory[0]?.data as FeedingData | undefined;
  const feeding: TodaySummary['feeding'] = {
    hasAny: feedingHistory.length > 0,
    todayCount: todayFeedings.length,
    lastAmount: lastFeeding?.amount,
    lastUnit: lastFeeding?.unit,
  };

  const todaySleeps = todayByType<SleepData>('sleep');
  const sleepHistory = await loadCareEventHistory(babyId, 'sleep');
  const todayTotalMinutes = todaySleeps.reduce(
    (sum, s) => sum + Math.max(0, (new Date(s.endAt).getTime() - new Date(s.startAt).getTime()) / 60000),
    0,
  );
  const sleep: TodaySummary['sleep'] = {
    hasAny: sleepHistory.length > 0,
    todayTotalMinutes,
  };

  const todayDiapers = todayByType<DiaperData>('diaper');
  const diaperHistory = await loadCareEventHistory(babyId, 'diaper');
  const wet = todayDiapers.filter((d) => d.diaperType === 'Wet' || d.diaperType === 'Both').length;
  const dirty = todayDiapers.filter((d) => d.diaperType === 'Dirty' || d.diaperType === 'Both').length;
  const diaper: TodaySummary['diaper'] = {
    hasAny: diaperHistory.length > 0,
    todayCount: todayDiapers.length,
    wet,
    dirty,
  };

  const todayKangaroo = todayByType<KangarooCareData>('kangaroo');
  const kangarooHistory = await loadCareEventHistory(babyId, 'kangaroo');
  const kangarooTodayTotalMinutes = todayKangaroo.reduce(
    (sum, k) => sum + Math.max(0, (new Date(k.endAt).getTime() - new Date(k.startAt).getTime()) / 60000),
    0,
  );
  const kangaroo: TodaySummary['kangaroo'] = {
    hasAny: kangarooHistory.length > 0,
    todayTotalMinutes: kangarooTodayTotalMinutes,
    todayCount: todayKangaroo.length,
  };

  return { weight, feeding, sleep, diaper, kangaroo };
}
