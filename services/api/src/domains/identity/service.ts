import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/service.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { CareEventsService } from '../care-events/service.js';
import { GrowthService } from '../growth/service.js';
import { RemindersService } from '../reminders/service.js';
import { SharingService } from '../sharing/service.js';
import { DeletionRequestStatus, StoredDeletionRequest, StoredSession } from './repository.js';

export class IdentityService {
  private sessions = new Map<string, StoredSession>();
  private deletionRequests = new Map<string, StoredDeletionRequest>();

  constructor(
    private audit: AuditService,
    private babyProfile: BabyProfileService,
    private careEvents: CareEventsService,
    private growth: GrowthService,
    private reminders: RemindersService,
    private sharing: SharingService,
  ) {}

  async createOrRefreshSession(email: string) {
    const userId = randomUUID();
    const accessToken = randomUUID();
    this.sessions.set(accessToken, { accessToken, userId, email, createdAt: new Date() });
    return {
      accessToken,
      refreshToken: randomUUID(),
      expiresInSeconds: 900,
      user: { id: userId, email },
    };
  }

  // Signs the user out everywhere at once (FR-018 account management) — every
  // session token for this email stops being valid immediately, since the
  // in-memory store backing session lookups is the same one this clears.
  // Keyed by email rather than userId: this stub identity service (no real
  // sign-in/lookup yet — Open Decision #5) mints a fresh random userId per
  // session, so email is the only stable identifier across a user's sessions.
  async revokeAllSessions(email: string) {
    let revokedCount = 0;
    for (const [token, session] of this.sessions) {
      if (session.email === email) {
        this.sessions.delete(token);
        revokedCount += 1;
      }
    }
    await this.audit.record({
      actorId: email,
      babyId: email,
      action: 'delete',
      entityType: 'session',
      entityId: email,
    });
    return { revokedCount };
  }

  // Deletion-request/approval pipeline per Open Decision #9 (Section 9): the
  // final retention/auto-purge timing is still pending clinical/legal
  // sign-off, so this only ever reaches 'pending' or 'cancelled' — no
  // automatic purge is implemented or should be assumed from this code.
  async requestDeletion(userId: string, reason?: string) {
    const request: StoredDeletionRequest = {
      id: randomUUID(),
      userId,
      reason,
      status: 'pending',
      requestedAt: new Date(),
      updatedAt: new Date(),
    };
    this.deletionRequests.set(request.id, request);
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
    return [...this.deletionRequests.values()].filter((r) => r.userId === userId);
  }

  async cancelDeletionRequest(userId: string, id: string) {
    const existing = this.deletionRequests.get(id);
    if (!existing || existing.userId !== userId) throw new Error('Deletion request not found');
    const updated: StoredDeletionRequest = {
      ...existing,
      status: 'cancelled' as DeletionRequestStatus,
      updatedAt: new Date(),
    };
    this.deletionRequests.set(id, updated);
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
