import { FastifyInstance } from 'fastify';
import { ForbiddenError, NotFoundError } from '../../common/auth/errors.js';
import { SharingService } from '../sharing/service.js';
import { babySchema } from './schema.js';
import { BabyProfileService } from './service.js';

export async function babyProfileRoutes(
  app: FastifyInstance,
  deps: { service: BabyProfileService; sharingService: SharingService },
) {
  const service = deps.service;

  // Owned babies plus babies shared *to* this user's email (FR: an invited
  // caregiver who already owns a different baby must still see one shared
  // with them, not just their own — see app/index.tsx on the mobile side).
  app.get('/v1/babies', async (request) => {
    const owned = await service.list(request.userId);
    const grants = await deps.sharingService.listActiveForEmail(request.userEmail);
    const shared = await Promise.all(
      grants.map(async (grant) => {
        const baby = await service.get(grant.babyId);
        return baby && baby.userId !== request.userId
          ? { ...baby, isOwner: false, permission: grant.permission }
          : undefined;
      }),
    );
    return [
      ...owned.map((baby) => ({ ...baby, isOwner: true as const })),
      ...shared.filter((baby): baby is NonNullable<typeof baby> => Boolean(baby)),
    ];
  });

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
