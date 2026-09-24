import { FastifyInstance } from 'fastify';
import { requireBabyAccess } from '../../common/auth/baby-access.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { SharingService } from '../sharing/service.js';
import { milestoneSchema } from './schema.js';
import { MilestoneService } from './service.js';

export async function milestoneRoutes(
  app: FastifyInstance,
  deps: {
    service: MilestoneService;
    babyProfileService: BabyProfileService;
    sharingService: SharingService;
  },
) {
  const service = deps.service;
  const access = { babyProfile: deps.babyProfileService, sharing: deps.sharingService };

  app.get(
    '/v1/babies/:babyId/milestones',
    { preHandler: requireBabyAccess(access, 'read') },
    async (request) => {
      const { babyId } = request.params as { babyId: string };
      return service.list(babyId);
    },
  );

  // PUT, not POST: the client always names the milestone (off-cpap,
  // discharged, ...) itself and the server upserts on it — there's no
  // server-assigned identity for the caller to discover from a 201.
  app.put(
    '/v1/babies/:babyId/milestones/:milestoneId',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request) => {
      const { babyId, milestoneId } = request.params as { babyId: string; milestoneId: string };
      const input = milestoneSchema.parse({ ...(request.body as object), milestoneId });
      return service.upsert(request.userId, babyId, input);
    },
  );

  app.delete(
    '/v1/babies/:babyId/milestones/:milestoneId',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request, reply) => {
      const { babyId, milestoneId } = request.params as { babyId: string; milestoneId: string };
      await service.remove(request.userId, babyId, milestoneId);
      reply.status(204);
    },
  );
}
