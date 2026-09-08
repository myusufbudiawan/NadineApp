import { FastifyInstance } from 'fastify';
import { BabyProfileService } from '../baby-profile/service.js';
import { CareEventsService } from '../care-events/service.js';
import { SharingService } from '../sharing/service.js';
import { PostgresSyncRepository } from './postgres-repository.js';
import { syncSchema } from './schema.js';
import { SyncService } from './service.js';
import { db } from '../../common/db/client.js';

export async function syncRoutes(
  app: FastifyInstance,
  deps: {
    careEventsService: CareEventsService;
    babyProfileService: BabyProfileService;
    sharingService: SharingService;
  },
) {
  const service = new SyncService(
    deps.careEventsService,
    new PostgresSyncRepository(db),
    deps.babyProfileService,
    deps.sharingService,
  );

  app.post('/v1/sync', async (request) => {
    const { mutations } = syncSchema.parse(request.body);
    const results = await service.apply(request.userId, request.userEmail, mutations);
    return { results };
  });
}
