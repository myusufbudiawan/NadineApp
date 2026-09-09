import { apiFetch } from './client';
import { CareEventType } from '@/features/care-events/types';

export type ServerCareEvent = {
  id: string;
  babyId: string;
  type: CareEventType;
  occurredAt: string;
  data: Record<string, unknown>;
  notes?: string;
  idempotencyKey: string;
  updatedAt: string;
};

export const listServerCareEvents = (babyId: string) =>
  apiFetch<ServerCareEvent[]>(`/v1/babies/${babyId}/events`);
