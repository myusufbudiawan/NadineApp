import { FastifyRequest } from 'fastify';
import { BabyProfileService } from '../../domains/baby-profile/service.js';
import { SharingService } from '../../domains/sharing/service.js';
import { ForbiddenError, NotFoundError } from './errors.js';

export type BabyAccessPermission = 'read' | 'write';

// The single place that decides "can this user touch this baby's data":
// either they own it, or someone who owns it has granted them read/write
// access (SharingService.hasActiveAccess). Every baby-scoped route and the
// sync domain's per-mutation loop call through here rather than duplicating
// this check.
export async function assertBabyAccess(
  deps: { babyProfile: BabyProfileService; sharing: SharingService },
  userId: string,
  userEmail: string,
  babyId: string,
  permission: BabyAccessPermission,
): Promise<void> {
  const baby = await deps.babyProfile.get(babyId);
  if (!baby) throw new NotFoundError('Baby not found');
  if (baby.userId === userId) return;
  const hasGrant = await deps.sharing.hasActiveAccess(babyId, userEmail, permission);
  if (!hasGrant) throw new ForbiddenError();
}

export function requireBabyAccess(
  deps: { babyProfile: BabyProfileService; sharing: SharingService },
  permission: BabyAccessPermission,
) {
  return async (request: FastifyRequest) => {
    const { babyId } = request.params as { babyId: string };
    await assertBabyAccess(deps, request.userId, request.userEmail, babyId, permission);
  };
}
