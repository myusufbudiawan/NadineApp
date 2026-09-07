import { FastifyInstance } from 'fastify';
import { babySchema } from './schema.js';
import { BabyProfileService } from './service.js';
const userId = 'development-user';

// deps.service lets one buildServer() call thread a single instance to
// domains that need cross-domain reads (Reports, Privacy) without reaching
// into this domain's storage directly (Constitution 0.A #3).
export async function babyProfileRoutes(
  app: FastifyInstance,
  deps: { service?: BabyProfileService } = {},
) {
  const service = deps.service ?? new BabyProfileService();
  app.get('/v1/babies', () => service.list(userId));
  app.post('/v1/babies', (request) =>
    service.create(userId, babySchema.parse(request.body)),
  );
  app.patch('/v1/babies/:id', (request) =>
    service.update(
      (request.params as { id: string }).id,
      babySchema.partial().parse(request.body),
    ),
  );
}
