import { FastifyInstance } from 'fastify';
import { auditService } from '../audit/service.js';
import { InMemoryGrowthRepository } from './repository.js';
import { growthSchema, GrowthMetric } from './schema.js';
import { GrowthService } from './service.js';

// deps.service lets one buildServer() call thread a single instance to
// domains that need cross-domain reads (Reports) without reaching into this
// domain's repository directly (Constitution 0.A #3).
export async function growthRoutes(
  app: FastifyInstance,
  deps: { service?: GrowthService } = {},
) {
  const service = deps.service ?? new GrowthService(new InMemoryGrowthRepository(), auditService);

  app.get('/v1/babies/:babyId/growth', async (request) => {
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
  });

  app.post('/v1/babies/:babyId/growth', async (request, reply) => {
    const { babyId } = request.params as { babyId: string };
    const input = growthSchema.parse(request.body);
    const measurement = await service.create(babyId, input);
    reply.status(201);
    return measurement;
  });
}
