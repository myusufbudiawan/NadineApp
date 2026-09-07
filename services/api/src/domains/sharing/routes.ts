import { FastifyInstance } from 'fastify';
import { auditService } from '../audit/service.js';
import { InMemoryShareRepository } from './repository.js';
import { shareSchema } from './schema.js';
import { SharingService } from './service.js';

// deps.service lets one buildServer() call thread a single instance to
// domains that need cross-domain reads (Privacy account export) without
// reaching into this domain's repository directly (Constitution 0.A #3).
export async function sharingRoutes(
  app: FastifyInstance,
  deps: { service?: SharingService } = {},
) {
  const service =
    deps.service ?? new SharingService(new InMemoryShareRepository(), auditService);

  app.get('/v1/babies/:babyId/shares', async (request) => {
    const { babyId } = request.params as { babyId: string };
    return service.list(babyId);
  });

  app.post('/v1/babies/:babyId/shares', async (request, reply) => {
    const { babyId } = request.params as { babyId: string };
    const input = shareSchema.parse(request.body);
    const grant = await service.create(babyId, input);
    reply.status(201);
    return grant;
  });

  app.delete('/v1/babies/:babyId/shares/:id', async (request) => {
    const { babyId, id } = request.params as { babyId: string; id: string };
    return service.revoke(babyId, id);
  });
}
