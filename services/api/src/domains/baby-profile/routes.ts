import { FastifyInstance } from 'fastify';
import { ForbiddenError, NotFoundError } from '../../common/auth/errors.js';
import { babySchema } from './schema.js';
import { BabyProfileService } from './service.js';

export async function babyProfileRoutes(
  app: FastifyInstance,
  deps: { service: BabyProfileService },
) {
  const service = deps.service;

  app.get('/v1/babies', (request) => service.list(request.userId));

  app.post('/v1/babies', (request) =>
    service.create(request.userId, babySchema.parse(request.body)),
  );

  // Profile edits are owner-only — a write share-grant lets a collaborator
  // log care events/growth/reminders, but not change who the baby is.
  app.patch('/v1/babies/:id', async (request) => {
    const { id } = request.params as { id: string };
    const baby = await service.get(id);
    if (!baby) throw new NotFoundError('Baby not found');
    if (baby.userId !== request.userId) throw new ForbiddenError();
    return service.update(id, babySchema.partial().parse(request.body));
  });
}
