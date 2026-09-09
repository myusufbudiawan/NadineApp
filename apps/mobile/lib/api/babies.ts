import { apiFetch } from './client';
import { BabyProfile } from '@/features/baby-profile/types';

export type ServerBaby = BabyProfile & {
  userId: string;
  isOwner: boolean;
  permission?: 'read' | 'write';
};

export const listBabies = () => apiFetch<ServerBaby[]>('/v1/babies');

export const createBaby = (profile: Omit<BabyProfile, 'id'>) =>
  apiFetch<ServerBaby>('/v1/babies', {
    method: 'POST',
    body: JSON.stringify(profile),
  });

export const updateBaby = (id: string, profile: Partial<Omit<BabyProfile, 'id'>>) =>
  apiFetch<ServerBaby>(`/v1/babies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(profile),
  });
