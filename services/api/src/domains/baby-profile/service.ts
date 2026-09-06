import { randomUUID } from 'node:crypto';
import { StoredBaby } from './repository.js';
export class BabyProfileService {
  private babies = new Map<string, StoredBaby>();
  async list(userId: string) {
    return [...this.babies.values()].filter((b) => b.userId === userId);
  }
  async create(userId: string, payload: Omit<StoredBaby, 'id' | 'userId'>) {
    const baby = { ...payload, id: randomUUID(), userId };
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
}
