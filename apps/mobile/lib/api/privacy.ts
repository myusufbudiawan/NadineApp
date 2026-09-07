import { apiFetch } from './client';

export type DeletionRequest = {
  id: string;
  userId: string;
  reason?: string;
  status: 'pending' | 'cancelled';
  requestedAt: string;
  updatedAt: string;
};

// Self-service export (FR-018) — distinct from the clinician-facing report
// export (lib/api/reports.ts): this dumps everything the account owns.
export const exportAccountData = () => apiFetch<unknown>('/v1/account/export');

export const listDeletionRequests = () =>
  apiFetch<DeletionRequest[]>('/v1/account/deletion-requests');

export const requestAccountDeletion = (reason?: string) =>
  apiFetch<DeletionRequest>('/v1/account/deletion-requests', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

export const cancelAccountDeletion = (id: string) =>
  apiFetch<DeletionRequest>(`/v1/account/deletion-requests/${id}/cancel`, { method: 'POST' });
