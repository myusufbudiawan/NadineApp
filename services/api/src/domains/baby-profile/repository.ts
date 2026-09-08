export type StoredBaby = {
  id: string;
  userId: string;
  name: string;
  sex: 'girl' | 'boy';
  dateOfBirth: Date;
  gestationalWeeks: number;
  gestationalDays: number;
  birthWeightKg: number;
  birthLengthCm?: number;
  birthHeadCircumferenceCm?: number;
  fullTermReferenceWeeks: number;
};
export interface BabyRepository {
  list(userId: string): Promise<StoredBaby[]>;
  create(baby: StoredBaby): Promise<StoredBaby>;
  update(id: string, patch: Partial<StoredBaby>): Promise<StoredBaby>;
  get(id: string): Promise<StoredBaby | undefined>;
}

export class InMemoryBabyRepository implements BabyRepository {
  private babies = new Map<string, StoredBaby>();

  async list(userId: string) {
    return [...this.babies.values()].filter((b) => b.userId === userId);
  }

  async create(baby: StoredBaby) {
    this.babies.set(baby.id, baby);
    return baby;
  }

  async update(id: string, patch: Partial<StoredBaby>) {
    const existing = this.babies.get(id);
    if (!existing) throw new Error('Baby not found');
    const baby = { ...existing, ...patch };
    this.babies.set(id, baby);
    return baby;
  }

  async get(id: string) {
    return this.babies.get(id);
  }
}
