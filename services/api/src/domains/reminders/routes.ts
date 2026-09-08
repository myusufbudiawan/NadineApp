import { FastifyInstance } from 'fastify';
import { requireBabyAccess } from '../../common/auth/baby-access.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { SharingService } from '../sharing/service.js';
import { reminderSchema, reminderUpdateSchema, snoozeSchema } from './schema.js';
import { RemindersService } from './service.js';

export async function remindersRoutes(
  app: FastifyInstance,
  deps: {
    service: RemindersService;
    babyProfileService: BabyProfileService;
    sharingService: SharingService;
  },
) {
  const service = deps.service;
  const access = { babyProfile: deps.babyProfileService, sharing: deps.sharingService };

  app.get(
    '/v1/babies/:babyId/reminders',
    { preHandler: requireBabyAccess(access, 'read') },
    async (request) => {
      const { babyId } = request.params as { babyId: string };
      return service.list(babyId);
    },
  );

  app.post(
    '/v1/babies/:babyId/reminders',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request, reply) => {
      const { babyId } = request.params as { babyId: string };
      const input = reminderSchema.parse(request.body);
      const reminder = await service.create(request.userId, babyId, input);
      reply.status(201);
      return reminder;
    },
  );

  app.patch(
    '/v1/babies/:babyId/reminders/:id',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request) => {
      const { babyId, id } = request.params as { babyId: string; id: string };
      const patch = reminderUpdateSchema.parse(request.body);
      return service.update(request.userId, babyId, id, patch);
    },
  );

  app.post(
    '/v1/babies/:babyId/reminders/:id/snooze',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request) => {
      const { babyId, id } = request.params as { babyId: string; id: string };
      const { minutes } = snoozeSchema.parse(request.body);
      return service.snooze(request.userId, babyId, id, minutes);
    },
  );

  app.post(
    '/v1/babies/:babyId/reminders/:id/complete',
    { preHandler: requireBabyAccess(access, 'write') },
    async (request) => {
      const { babyId, id } = request.params as { babyId: string; id: string };
      return service.complete(request.userId, babyId, id);
    },
  );
}
