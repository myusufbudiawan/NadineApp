import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/service.js';
import { ShareRepository, SharePermission } from './repository.js';
import { ShareInput } from './schema.js';

const actorId = 'development-user';

export class SharingService {
  constructor(
    private repository: ShareRepository,
    private audit: AuditService,
  ) {}

  list(babyId: string) {
    return this.repository.list(babyId);
  }

  // Explicit consent capture: a grant exists only because this call was made
  // with the inviting caregiver's confirmation (FR-016) — no implicit sharing.
  async create(babyId: string, input: ShareInput) {
    const grant = await this.repository.create({
      id: randomUUID(),
      babyId,
      granteeEmail: input.recipientEmail,
      permission: input.permission,
      createdAt: new Date(),
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'create',
      entityType: 'share_grant',
      entityId: grant.id,
    });
    return grant;
  }

  private async requireOwned(babyId: string, id: string) {
    const grant = await this.repository.get(id);
    if (!grant || grant.babyId !== babyId) throw new Error('Share grant not found');
    return grant;
  }

  // Revocation is immediate: hasActiveAccess below reads the same store, so
  // the next authorization check after this resolves sees no active grant —
  // no cached-permission bypass window (Section 15, FR-016 acceptance).
  async revoke(babyId: string, id: string) {
    const existing = await this.requireOwned(babyId, id);
    if (existing.revokedAt) return existing;
    const revoked = await this.repository.update({ ...existing, revokedAt: new Date() });
    await this.audit.record({
      actorId,
      babyId,
      action: 'update',
      entityType: 'share_grant',
      entityId: id,
    });
    return revoked;
  }

  // Authorization check every baby-scoped protected resource should call once
  // real sessions exist (Phase 0.3 / 5.2) — revoked or absent grants never
  // grant access.
  async hasActiveAccess(babyId: string, granteeEmail: string, permission: SharePermission = 'read') {
    const grants = await this.repository.list(babyId);
    return grants.some(
      (g) =>
        g.granteeEmail === granteeEmail &&
        !g.revokedAt &&
        (permission === 'read' || g.permission === 'write'),
    );
  }
}
