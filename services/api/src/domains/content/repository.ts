import { ReviewStatus, TipCategory } from './schema.js';

export type StoredTipContent = {
  id: string;
  title: string;
  body: string;
  category: TipCategory;
  minCorrectedAgeDays?: number;
  maxCorrectedAgeDays?: number;
  source: string;
  reviewStatus: ReviewStatus;
  reviewedAt?: Date;
  createdAt: Date;
};

export interface ContentRepository {
  list(): Promise<StoredTipContent[]>;
  create(tip: StoredTipContent): Promise<StoredTipContent>;
}

export class InMemoryContentRepository implements ContentRepository {
  private tips = new Map<string, StoredTipContent>();

  async list() {
    return [...this.tips.values()];
  }

  async create(tip: StoredTipContent) {
    this.tips.set(tip.id, tip);
    return tip;
  }
}
