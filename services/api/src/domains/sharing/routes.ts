import { FastifyInstance, FastifyRequest } from 'fastify';
import { requireBabyAccess } from '../../common/auth/baby-access.js';
import { ForbiddenError, NotFoundError } from '../../common/auth/errors.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { shareSchema } from './schema.js';
import { SharingService } from './service.js';

export async function sharingRoutes(
  app: FastifyInstance,
  deps: { service: SharingService; babyProfileService: BabyProfileService },
) {
  const service = deps.service;
  // Managing collaborators is owner-only — a write grant lets someone log
  // care events, not invite/revoke other collaborators.
  const requireOwner = async (request: FastifyRequest) => {
    const { babyId } = request.params as { babyId: string };
    const baby = await deps.babyProfileService.get(babyId);
    if (!baby) throw new NotFoundError('Baby not found');
    if (baby.userId !== request.userId) throw new ForbiddenError();
  };

  app.get(
    '/v1/babies/:babyId/shares',
    { preHandler: requireBabyAccess({ babyProfile: deps.babyProfileService, sharing: service }, 'read') },
    async (request) => {
      const { babyId } = request.params as { babyId: string };
      return service.list(babyId);
    },
  );

  app.post('/v1/babies/:babyId/shares', { preHandler: requireOwner }, async (request, reply) => {
    const { babyId } = request.params as { babyId: string };
    const input = shareSchema.parse(request.body);
    const grant = await service.create(request.userId, babyId, input);
    reply.status(201);
    return grant;
  });

  app.delete('/v1/babies/:babyId/shares/:id', { preHandler: requireOwner }, async (request) => {
    const { babyId, id } = request.params as { babyId: string; id: string };
    return service.revoke(request.userId, babyId, id);
  });
}
