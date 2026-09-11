export type SharePermission = 'read' | 'write';

export type StoredShareGrant = {
  id: string;
  babyId: string;
  granteeEmail: string;
  permission: SharePermission;
  createdAt: Date;
  revokedAt?: Date;
};

export interface ShareRepository {
  list(babyId: string): Promise<StoredShareGrant[]>;
  listByEmail(granteeEmail: string): Promise<StoredShareGrant[]>;
  get(id: string): Promise<StoredShareGrant | undefined>;
  create(grant: StoredShareGrant): Promise<StoredShareGrant>;
  update(grant: StoredShareGrant): Promise<StoredShareGrant>;
}

export class InMemoryShareRepository implements ShareRepository {
  private grants = new Map<string, StoredShareGrant>();

  async list(babyId: string) {
    return [...this.grants.values()].filter((g) => g.babyId === babyId);
  }

  async listByEmail(granteeEmail: string) {
    const target = granteeEmail.toLowerCase();
    return [...this.grants.values()].filter((g) => g.granteeEmail.toLowerCase() === target);
  }

  async get(id: string) {
    return this.grants.get(id);
  }

  async create(grant: StoredShareGrant) {
    this.grants.set(grant.id, grant);
    return grant;
  }

  async update(grant: StoredShareGrant) {
    this.grants.set(grant.id, grant);
    return grant;
  }
}
