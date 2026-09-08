import { FastifyInstance } from 'fastify';
import { requireBabyAccess } from '../../common/auth/baby-access.js';
import { AuditService } from '../audit/service.js';
import { BabyProfileService } from '../baby-profile/service.js';
import { CareEventsService } from '../care-events/service.js';
import { GrowthService } from '../growth/service.js';
import { SharingService } from '../sharing/service.js';
import { reportSchema } from './schema.js';
import { ReportsService } from './service.js';

export async function reportsRoutes(
  app: FastifyInstance,
  deps: {
    babyProfileService: BabyProfileService;
    careEventsService: CareEventsService;
    growthService: GrowthService;
    sharingService: SharingService;
    auditService: AuditService;
  },
) {
  const service = new ReportsService(
    deps.babyProfileService,
    deps.careEventsService,
    deps.growthService,
    deps.auditService,
  );

  app.post(
    '/v1/babies/:babyId/reports',
    {
      preHandler: requireBabyAccess(
        { babyProfile: deps.babyProfileService, sharing: deps.sharingService },
        'read',
      ),
    },
    async (request, reply) => {
      const { babyId } = request.params as { babyId: string };
      const input = reportSchema.parse(request.body);
      const report = await service.generate(request.userId, babyId, input);

      if (input.format === 'csv') {
        reply.header('Content-Type', 'text/csv');
        reply.header(
          'Content-Disposition',
          `attachment; filename="preemietrack-report-${babyId}.csv"`,
        );
        return service.toCsv(report);
      }
      return report;
    },
  );
}
