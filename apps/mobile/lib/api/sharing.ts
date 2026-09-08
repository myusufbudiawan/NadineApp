import { apiFetch } from './client';

export type SharePermission = 'read' | 'write';

export type ShareGrant = {
  id: string;
  babyId: string;
  granteeEmail: string;
  permission: SharePermission;
  createdAt: string;
  revokedAt?: string;
};

export const listShares = (babyId: string) =>
  apiFetch<ShareGrant[]>(`/v1/babies/${babyId}/shares`);

export const inviteCaregiver = (
  babyId: string,
  input: { recipientEmail: string; permission: SharePermission },
) =>
  apiFetch<ShareGrant>(`/v1/babies/${babyId}/shares`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

// Immediate revocation — the caller should treat a resolved promise as
// access already denied (Section 15: no cached-permission bypass).
export const revokeShare = (babyId: string, id: string) =>
  apiFetch<ShareGrant>(`/v1/babies/${babyId}/shares/${id}`, { method: 'DELETE' });
