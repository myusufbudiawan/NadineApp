import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../common/auth/errors.js';
import { BabyRepository, StoredBaby } from './repository.js';

export class BabyProfileService {
  constructor(private repository: BabyRepository) {}

  async list(userId: string) {
    return this.repository.list(userId);
  }

  async create(userId: string, payload: Omit<StoredBaby, 'id' | 'userId'>) {
    return this.repository.create({ ...payload, id: randomUUID(), userId });
  }

  async update(id: string, patch: Partial<StoredBaby>) {
    const existing = await this.repository.get(id);
    if (!existing) throw new NotFoundError('Baby not found');
    return this.repository.update(id, patch);
  }

  async get(id: string) {
    return this.repository.get(id);
  }
}
