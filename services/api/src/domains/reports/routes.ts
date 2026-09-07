import { FastifyInstance } from 'fastify';
import { auditService } from '../audit/service.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { CareEventsService } from '../care-events/service.js';
import { InMemoryCareEventRepository } from '../care-events/repository.js';
import { GrowthService } from '../growth/service.js';
import { InMemoryGrowthRepository } from '../growth/repository.js';
import { reportSchema } from './schema.js';
import { ReportsService } from './service.js';

export async function reportsRoutes(
  app: FastifyInstance,
  deps: {
    babyProfileService?: BabyProfileService;
    careEventsService?: CareEventsService;
    growthService?: GrowthService;
  } = {},
) {
  const service = new ReportsService(
    deps.babyProfileService ?? new BabyProfileService(),
    deps.careEventsService ?? new CareEventsService(new InMemoryCareEventRepository(), auditService),
    deps.growthService ?? new GrowthService(new InMemoryGrowthRepository(), auditService),
    auditService,
  );

  app.post('/v1/babies/:babyId/reports', async (request, reply) => {
    const { babyId } = request.params as { babyId: string };
    const input = reportSchema.parse(request.body);
    const report = await service.generate(babyId, input);

    if (input.format === 'csv') {
      reply.header('Content-Type', 'text/csv');
      reply.header(
        'Content-Disposition',
        `attachment; filename="preemietrack-report-${babyId}.csv"`,
      );
      return service.toCsv(report);
    }
    return report;
  });
}
