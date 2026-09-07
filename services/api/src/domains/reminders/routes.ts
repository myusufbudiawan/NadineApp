import { FastifyInstance } from 'fastify';
import { auditService } from '../audit/service.js';
import { InMemoryReminderRepository } from './repository.js';
import { reminderSchema, reminderUpdateSchema, snoozeSchema } from './schema.js';
import { RemindersService } from './service.js';

// deps.service lets one buildServer() call thread a single instance to
// domains that need cross-domain reads (Privacy account export) without
// reaching into this domain's repository directly (Constitution 0.A #3).
export async function remindersRoutes(
  app: FastifyInstance,
  deps: { service?: RemindersService } = {},
) {
  const service =
    deps.service ?? new RemindersService(new InMemoryReminderRepository(), auditService);

  app.get('/v1/babies/:babyId/reminders', async (request) => {
    const { babyId } = request.params as { babyId: string };
    return service.list(babyId);
  });

  app.post('/v1/babies/:babyId/reminders', async (request, reply) => {
    const { babyId } = request.params as { babyId: string };
    const input = reminderSchema.parse(request.body);
    const reminder = await service.create(babyId, input);
    reply.status(201);
    return reminder;
  });

  app.patch('/v1/babies/:babyId/reminders/:id', async (request) => {
    const { babyId, id } = request.params as { babyId: string; id: string };
    const patch = reminderUpdateSchema.parse(request.body);
    return service.update(babyId, id, patch);
  });

  app.post('/v1/babies/:babyId/reminders/:id/snooze', async (request) => {
    const { babyId, id } = request.params as { babyId: string; id: string };
    const { minutes } = snoozeSchema.parse(request.body);
    return service.snooze(babyId, id, minutes);
  });

  app.post('/v1/babies/:babyId/reminders/:id/complete', async (request) => {
    const { babyId, id } = request.params as { babyId: string; id: string };
    return service.complete(babyId, id);
  });
}
