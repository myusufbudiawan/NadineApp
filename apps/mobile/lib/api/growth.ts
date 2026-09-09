import { apiFetch } from './client';
import { GrowthMetric } from '@/features/growth/types';

export type ServerGrowthMeasurement = {
  id: string;
  babyId: string;
  metric: GrowthMetric;
  value: number;
  unit: string;
  measuredAt: string;
  idempotencyKey?: string;
};

export const listServerGrowth = (babyId: string) =>
  apiFetch<ServerGrowthMeasurement[]>(`/v1/babies/${babyId}/growth`);
