import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../common/auth/errors.js';
import { AuditService } from '../audit/service.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { CareEventsService } from '../care-events/service.js';
import { GrowthService } from '../growth/service.js';
import { RemindersService } from '../reminders/service.js';
import { SharingService } from '../sharing/service.js';
import { DeletionRequestRepository, DeletionRequestStatus } from './repository.js';

export class IdentityService {
  constructor(
    private audit: AuditService,
    private babyProfile: BabyProfileService,
    private careEvents: CareEventsService,
    private growth: GrowthService,
    private reminders: RemindersService,
    private sharing: SharingService,
    private deletionRequests: DeletionRequestRepository,
  ) {}

  // Deletion-request/approval pipeline per Open Decision #9 (Section 9): the
  // final retention/auto-purge timing is still pending clinical/legal
  // sign-off, so this only ever reaches 'pending' or 'cancelled' — no
  // automatic purge is implemented or should be assumed from this code.
  async requestDeletion(userId: string, reason?: string) {
    const request = await this.deletionRequests.create({
      id: randomUUID(),
      userId,
      reason,
      status: 'pending',
      requestedAt: new Date(),
      updatedAt: new Date(),
    });
    await this.audit.record({
      actorId: userId,
      babyId: userId,
      action: 'create',
      entityType: 'deletion_request',
      entityId: request.id,
    });
    return request;
  }

  async listDeletionRequests(userId: string) {
    return this.deletionRequests.listByUser(userId);
  }

  async cancelDeletionRequest(userId: string, id: string) {
    const existing = await this.deletionRequests.get(id);
    if (!existing || existing.userId !== userId) throw new NotFoundError('Deletion request not found');
    const updated = await this.deletionRequests.update({
      ...existing,
      status: 'cancelled' as DeletionRequestStatus,
      updatedAt: new Date(),
    });
    await this.audit.record({
      actorId: userId,
      babyId: userId,
      action: 'update',
      entityType: 'deletion_request',
      entityId: id,
    });
    return updated;
  }

  // Self-service data export (FR-018), distinct from the clinician-facing
  // report export (Reports domain, Section 4.2) — this dumps everything the
  // account owns, not a date-ranged clinical summary. Cross-domain reads go
  // through each domain's own service (Constitution 0.A #3).
  async exportAccount(userId: string) {
    const babies = await this.babyProfile.list(userId);
    const babyExports = await Promise.all(
      babies.map(async (baby) => ({
        baby,
        careEvents: await this.careEvents.list(baby.id),
        growthMeasurements: await this.growth.list(baby.id),
        reminders: await this.reminders.list(baby.id),
        shareGrants: await this.sharing.list(baby.id),
      })),
    );
    await this.audit.record({
      actorId: userId,
      babyId: userId,
      action: 'create',
      entityType: 'account_export',
      entityId: randomUUID(),
    });
    return { exportedAt: new Date(), userId, babies: babyExports };
  }
}
