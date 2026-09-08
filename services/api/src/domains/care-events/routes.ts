import { FastifyInstance } from 'fastify';
import { requireBabyAccess } from '../../common/auth/baby-access.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { SharingService } from '../sharing/service.js';
import { CareEventType } from './repository.js';
import { careEventPatchSchema, careEventSchema } from './schema.js';
import { CareEventsService } from './service.js';

export async function careEventsRoutes(
  app: FastifyInstance,
  deps: {
    service: CareEventsService;
    babyProfileService: BabyProfileService;
    sharingService: SharingService;
  },
) {
  const service = deps.service;
  const access = { babyProfile: deps.babyProfileService, sharing: deps.sharingService };

  app.get(
    '/v1/babies/:babyId/events',
    { preHandler: requireBabyAccess(access, 'read') },
    async (request) => {
      const { babyId } = request.params as { babyId: string };
      const { type } = request.query as { type?: CareEventType };
      return service.list(babyId, type);
    },
  );

  app.post(
    '/v1/babies/:babyId/events',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request, reply) => {
      const { babyId } = request.params as { babyId: string };
      const input = careEventSchema.parse(request.body);
      const event = await service.create(request.userId, babyId, input);
      reply.status(201);
      return event;
    },
  );

  app.patch(
    '/v1/babies/:babyId/events/:eventId',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request) => {
      const { babyId, eventId } = request.params as {
        babyId: string;
        eventId: string;
      };
      const patch = careEventPatchSchema.parse(request.body);
      return service.update(request.userId, babyId, eventId, patch);
    },
  );

  app.delete(
    '/v1/babies/:babyId/events/:eventId',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request, reply) => {
      const { babyId, eventId } = request.params as {
        babyId: string;
        eventId: string;
      };
      await service.remove(request.userId, babyId, eventId);
      reply.status(204);
      return null;
    },
  );
}
