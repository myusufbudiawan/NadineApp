import { FastifyInstance } from 'fastify';
import { requireBabyAccess } from '../../common/auth/baby-access.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { SharingService } from '../sharing/service.js';
import { auditService } from './service.js';

// Internal-only: no raw event payload is ever stored or returned here, only
// actor/action/entity/timestamp (FR-019).
export async function auditRoutes(
  app: FastifyInstance,
  deps: { babyProfileService: BabyProfileService; sharingService: SharingService },
) {
  app.get(
    '/v1/babies/:babyId/audit',
    {
      preHandler: requireBabyAccess(
        { babyProfile: deps.babyProfileService, sharing: deps.sharingService },
        'read',
      ),
    },
    async (request) => {
      const { babyId } = request.params as { babyId: string };
      return auditService.list(babyId);
    },
  );
}
