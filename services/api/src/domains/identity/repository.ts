export interface IdentityRepository {
  findUserByEmail(email: string): Promise<{ id: string; email: string } | null>;
}

export type StoredSession = {
  accessToken: string;
  userId: string;
  email: string;
  createdAt: Date;
};

export type DeletionRequestStatus = 'pending' | 'cancelled';

export type StoredDeletionRequest = {
  id: string;
  userId: string;
  reason?: string;
  status: DeletionRequestStatus;
  requestedAt: Date;
  updatedAt: Date;
};
