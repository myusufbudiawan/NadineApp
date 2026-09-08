export type DeletionRequestStatus = 'pending' | 'cancelled';

export type StoredDeletionRequest = {
  id: string;
  userId: string;
  reason?: string;
  status: DeletionRequestStatus;
  requestedAt: Date;
  updatedAt: Date;
};

export interface DeletionRequestRepository {
  create(request: StoredDeletionRequest): Promise<StoredDeletionRequest>;
  listByUser(userId: string): Promise<StoredDeletionRequest[]>;
  get(id: string): Promise<StoredDeletionRequest | undefined>;
  update(request: StoredDeletionRequest): Promise<StoredDeletionRequest>;
}

export class InMemoryDeletionRequestRepository implements DeletionRequestRepository {
  private requests = new Map<string, StoredDeletionRequest>();

  async create(request: StoredDeletionRequest) {
    this.requests.set(request.id, request);
    return request;
  }

  async listByUser(userId: string) {
    return [...this.requests.values()].filter((r) => r.userId === userId);
  }

  async get(id: string) {
    return this.requests.get(id);
  }

  async update(request: StoredDeletionRequest) {
    this.requests.set(request.id, request);
    return request;
  }
}
