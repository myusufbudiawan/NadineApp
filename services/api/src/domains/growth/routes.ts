import { FastifyInstance } from 'fastify';
import { requireBabyAccess } from '../../common/auth/baby-access.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { SharingService } from '../sharing/service.js';
import { growthSchema, GrowthMetric } from './schema.js';
import { GrowthService } from './service.js';

export async function growthRoutes(
  app: FastifyInstance,
  deps: {
    service: GrowthService;
    babyProfileService: BabyProfileService;
    sharingService: SharingService;
  },
) {
  const service = deps.service;
  const access = { babyProfile: deps.babyProfileService, sharing: deps.sharingService };

  app.get(
    '/v1/babies/:babyId/growth',
    { preHandler: requireBabyAccess(access, 'read') },
    async (request) => {
      const { babyId } = request.params as { babyId: string };
      const { metric, from, to } = request.query as {
        metric?: GrowthMetric;
        from?: string;
        to?: string;
      };
      return service.list(
        babyId,
        metric,
        from ? new Date(from) : undefined,
        to ? new Date(to) : undefined,
      );
    },
  );

  app.post(
    '/v1/babies/:babyId/growth',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request, reply) => {
      const { babyId } = request.params as { babyId: string };
      const input = growthSchema.parse(request.body);
      const measurement = await service.create(request.userId, babyId, input);
      reply.status(201);
      return measurement;
    },
  );
}
