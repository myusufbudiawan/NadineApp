import { FastifyInstance } from 'fastify';
import { auditService } from '../audit/service.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { CareEventsService } from '../care-events/service.js';
import { InMemoryCareEventRepository } from '../care-events/repository.js';
import { GrowthService } from '../growth/service.js';
import { InMemoryGrowthRepository } from '../growth/repository.js';
import { RemindersService } from '../reminders/service.js';
import { InMemoryReminderRepository } from '../reminders/repository.js';
import { SharingService } from '../sharing/service.js';
import { InMemoryShareRepository } from '../sharing/repository.js';
import { deletionRequestSchema, sessionSchema } from './schema.js';
import { IdentityService } from './service.js';

// No real session/auth middleware exists yet (Open Decision #5, Phase 0.3) —
// every domain in this codebase reads/writes a single hardcoded dev user
// rather than a token-resolved one; account-scoped privacy endpoints follow
// the same convention until real sessions land.
const userId = 'development-user';

export async function identityRoutes(
  app: FastifyInstance,
  deps: {
    babyProfileService?: BabyProfileService;
    careEventsService?: CareEventsService;
    growthService?: GrowthService;
    remindersService?: RemindersService;
    sharingService?: SharingService;
  } = {},
) {
  const service = new IdentityService(
    auditService,
    deps.babyProfileService ?? new BabyProfileService(),
    deps.careEventsService ?? new CareEventsService(new InMemoryCareEventRepository(), auditService),
    deps.growthService ?? new GrowthService(new InMemoryGrowthRepository(), auditService),
    deps.remindersService ?? new RemindersService(new InMemoryReminderRepository(), auditService),
    deps.sharingService ?? new SharingService(new InMemoryShareRepository(), auditService),
  );

  app.post('/v1/auth/session', async (request) => {
    const { email } = sessionSchema.parse(request.body);
    return service.createOrRefreshSession(email);
  });

  app.post('/v1/auth/sessions/revoke-all', async (request) => {
    const { email } = sessionSchema.pick({ email: true }).parse(request.body);
    return service.revokeAllSessions(email);
  });

  app.get('/v1/account/export', async () => service.exportAccount(userId));

  app.post('/v1/account/deletion-requests', async (request, reply) => {
    const { reason } = deletionRequestSchema.parse(request.body ?? {});
    const created = await service.requestDeletion(userId, reason);
    reply.status(201);
    return created;
  });

  app.get('/v1/account/deletion-requests', async () => service.listDeletionRequests(userId));

  app.post('/v1/account/deletion-requests/:id/cancel', async (request) => {
    const { id } = request.params as { id: string };
    return service.cancelDeletionRequest(userId, id);
  });
}
