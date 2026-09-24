import { apiFetch } from './client';
import { MilestoneId } from '@/features/milestones/types';

export type ServerMilestone = {
  id: string;
  babyId: string;
  milestoneId: MilestoneId;
  achievedAt: string;
  celebrated: boolean;
  updatedAt: string;
};

export const listServerMilestones = (babyId: string) =>
  apiFetch<ServerMilestone[]>(`/v1/babies/${babyId}/milestones`);

export const upsertServerMilestone = (
  babyId: string,
  milestoneId: MilestoneId,
  achievedAt: string,
  celebrated: boolean,
) =>
  apiFetch<ServerMilestone>(`/v1/babies/${babyId}/milestones/${milestoneId}`, {
    method: 'PUT',
    body: JSON.stringify({ achievedAt, celebrated }),
  });

export const deleteServerMilestone = (babyId: string, milestoneId: MilestoneId) =>
  apiFetch<void>(`/v1/babies/${babyId}/milestones/${milestoneId}`, { method: 'DELETE' });
