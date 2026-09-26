export type StoredMilestone = {
  id: string;
  babyId: string;
  milestoneId: string;
  achievedAt: Date;
  celebrated: boolean;
  updatedAt: Date;
};

export interface MilestoneRepository {
  list(babyId: string): Promise<StoredMilestone[]>;
  /** Upserts by (babyId, milestoneId) — a milestone has exactly one achieved date at a time. */
  upsert(input: {
    id: string;
    babyId: string;
    milestoneId: string;
    achievedAt: Date;
    celebrated: boolean;
  }): Promise<StoredMilestone>;
  /** Returns the removed row (for audit's entityId), or undefined if there was nothing to remove. */
  remove(babyId: string, milestoneId: string): Promise<StoredMilestone | undefined>;
}

export class InMemoryMilestoneRepository implements MilestoneRepository {
  private milestones = new Map<string, StoredMilestone>();

  private key(babyId: string, milestoneId: string) {
    return `${babyId}:${milestoneId}`;
  }

  async list(babyId: string) {
    return [...this.milestones.values()]
      .filter((m) => m.babyId === babyId)
      .sort((a, b) => a.achievedAt.getTime() - b.achievedAt.getTime());
  }

  async upsert(input: {
    id: string;
    babyId: string;
    milestoneId: string;
    achievedAt: Date;
    celebrated: boolean;
  }) {
    const key = this.key(input.babyId, input.milestoneId);
    const existing = this.milestones.get(key);
    const stored: StoredMilestone = {
      id: existing?.id ?? input.id,
      babyId: input.babyId,
      milestoneId: input.milestoneId,
      achievedAt: input.achievedAt,
      celebrated: input.celebrated,
      updatedAt: new Date(),
    };
    this.milestones.set(key, stored);
    return stored;
  }

  async remove(babyId: string, milestoneId: string) {
    const key = this.key(babyId, milestoneId);
    const existing = this.milestones.get(key);
    this.milestones.delete(key);
    return existing;
  }
}
