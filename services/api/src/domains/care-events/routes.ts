import { FastifyInstance } from 'fastify';
import { auditService } from '../audit/service.js';
import { CareEventType, InMemoryCareEventRepository } from './repository.js';
import { careEventPatchSchema, careEventSchema } from './schema.js';
import { CareEventsService } from './service.js';

// deps.service lets one buildServer() call thread a single instance to
// domains that need cross-domain reads (Reports) without reaching into this
// domain's repository directly (Constitution 0.A #3).
export async function careEventsRoutes(
  app: FastifyInstance,
  deps: { service?: CareEventsService } = {},
) {
  const service =
    deps.service ?? new CareEventsService(new InMemoryCareEventRepository(), auditService);

  app.get('/v1/babies/:babyId/events', async (request) => {
    const { babyId } = request.params as { babyId: string };
    const { type } = request.query as { type?: CareEventType };
    return service.list(babyId, type);
  });

  app.post('/v1/babies/:babyId/events', async (request, reply) => {
    const { babyId } = request.params as { babyId: string };
    const input = careEventSchema.parse(request.body);
    const event = await service.create(babyId, input);
    reply.status(201);
    return event;
  });

  app.patch('/v1/babies/:babyId/events/:eventId', async (request) => {
    const { babyId, eventId } = request.params as {
      babyId: string;
      eventId: string;
    };
    const patch = careEventPatchSchema.parse(request.body);
    return service.update(babyId, eventId, patch);
  });

  app.delete('/v1/babies/:babyId/events/:eventId', async (request, reply) => {
    const { babyId, eventId } = request.params as {
      babyId: string;
      eventId: string;
    };
    await service.remove(babyId, eventId);
    reply.status(204);
    return null;
  });
}
