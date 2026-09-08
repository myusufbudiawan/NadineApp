import { FastifyInstance } from 'fastify';
import { auditService } from '../audit/service.js';
import { db } from '../../common/db/client.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { CareEventsService } from '../care-events/service.js';
import { GrowthService } from '../growth/service.js';
import { RemindersService } from '../reminders/service.js';
import { SharingService } from '../sharing/service.js';
import { deletionRequestSchema } from './schema.js';
import { PostgresDeletionRequestRepository } from './postgres-repository.js';
import { IdentityService } from './service.js';

// Mobile authenticates directly against Supabase Auth — this domain no
// longer issues or verifies its own sessions, only handles account-level
// self-service actions (export, deletion requests) for the already
// authenticated user (request.userId, set by common/auth/plugin.ts).
export async function identityRoutes(
  app: FastifyInstance,
  deps: {
    babyProfileService: BabyProfileService;
    careEventsService: CareEventsService;
    growthService: GrowthService;
    remindersService: RemindersService;
    sharingService: SharingService;
  },
) {
  const service = new IdentityService(
    auditService,
    deps.babyProfileService,
    deps.careEventsService,
    deps.growthService,
    deps.remindersService,
    deps.sharingService,
    new PostgresDeletionRequestRepository(db),
  );

  app.get('/v1/account/export', async (request) => service.exportAccount(request.userId));

  app.post('/v1/account/deletion-requests', async (request, reply) => {
    const { reason } = deletionRequestSchema.parse(request.body ?? {});
    const created = await service.requestDeletion(request.userId, reason);
    reply.status(201);
    return created;
  });

  app.get('/v1/account/deletion-requests', async (request) =>
    service.listDeletionRequests(request.userId),
  );

  app.post('/v1/account/deletion-requests/:id/cancel', async (request) => {
    const { id } = request.params as { id: string };
    return service.cancelDeletionRequest(request.userId, id);
  });
}
