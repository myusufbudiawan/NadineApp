import { apiFetch } from './client';

export type SyncMutationRequest = {
  id: string;
  type: string;
  payload: unknown;
};

export type SyncMutationResult = {
  id: string;
  status: 'applied' | 'duplicate' | 'conflict' | 'error';
  event?: { id: string; updatedAt: string };
  serverEvent?: unknown;
  error?: string;
};

export const submitMutations = (mutations: SyncMutationRequest[]) =>
  apiFetch<{ results: SyncMutationResult[] }>('/v1/sync', {
    method: 'POST',
    body: JSON.stringify({ mutations }),
  });
