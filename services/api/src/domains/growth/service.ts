import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/service.js';
import { GrowthRepository } from './repository.js';
import { GrowthInput, GrowthMetric } from './schema.js';

/** NEEDS-CLINICAL-REVIEW: reference/percentile data is intentionally not embedded here. */
export class GrowthService {
  constructor(
    private repository: GrowthRepository,
    private audit: AuditService,
  ) {}

  list(babyId: string, metric?: GrowthMetric, from?: Date, to?: Date) {
    return this.repository.list(babyId, metric, from, to);
  }

  async create(actorId: string, babyId: string, input: GrowthInput) {
    if (input.idempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(babyId, input.idempotencyKey);
      if (existing) return existing;
    }
    const now = new Date();
    const measurement = await this.repository.create({
      id: randomUUID(),
      babyId,
      metric: input.metric,
      value: input.value,
      unit: input.unit,
      measuredAt: input.measuredAt,
      createdAt: now,
      idempotencyKey: input.idempotencyKey,
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'create',
      entityType: 'growth_measurement',
      entityId: measurement.id,
    });
    return measurement;
  }
}
