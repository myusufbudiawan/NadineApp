import { FastifyInstance } from 'fastify';
import { InMemoryContentRepository } from './repository.js';
import { seedPlaceholderTips } from './seed.js';
import { tipCategories, tipSchema, TipCategory } from './schema.js';
import { ContentService } from './service.js';

export async function contentRoutes(app: FastifyInstance) {
  const contentService = new ContentService(new InMemoryContentRepository());
  await seedPlaceholderTips(contentService);

  app.get('/v1/tips', async (request) => {
    const { category, correctedAgeDays } = request.query as {
      category?: TipCategory;
      correctedAgeDays?: string;
    };
    return contentService.list({
      category: category && tipCategories.includes(category) ? category : undefined,
      correctedAgeDays: correctedAgeDays !== undefined ? Number(correctedAgeDays) : undefined,
    });
  });

  // Authoring endpoint standing in for the dedicated admin console called for
  // in Section 10.1 acceptance criteria — no separate authenticated console
  // UI exists yet (flagged as a gap in the task tracker).
  app.post('/v1/tips', async (request, reply) => {
    const input = tipSchema.parse(request.body);
    const tip = await contentService.create(input);
    reply.status(201);
    return tip;
  });
}
