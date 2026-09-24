import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/service.js';
import { MilestoneRepository } from './repository.js';
import { MilestoneInput } from './schema.js';

export class MilestoneService {
  constructor(
    private repository: MilestoneRepository,
    private audit: AuditService,
  ) {}

  list(babyId: string) {
    return this.repository.list(babyId);
  }

  async upsert(actorId: string, babyId: string, input: MilestoneInput) {
    const milestone = await this.repository.upsert({
      id: randomUUID(),
      babyId,
      milestoneId: input.milestoneId,
      achievedAt: input.achievedAt,
      celebrated: input.celebrated,
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'update',
      entityType: 'milestone',
      entityId: milestone.id,
    });
    return milestone;
  }

  async remove(actorId: string, babyId: string, milestoneId: string) {
    const removed = await this.repository.remove(babyId, milestoneId);
    // Nothing to audit — and no UUID entityId to record — if it was already gone.
    if (!removed) return;
    await this.audit.record({
      actorId,
      babyId,
      action: 'delete',
      entityType: 'milestone',
      entityId: removed.id,
    });
  }
}
