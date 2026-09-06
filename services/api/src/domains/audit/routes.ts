import { FastifyInstance } from 'fastify';
import { auditService } from './service.js';

// Internal-only: no raw event payload is ever stored or returned here, only
// actor/action/entity/timestamp (FR-019).
export async function auditRoutes(app: FastifyInstance) {
  app.get('/v1/babies/:babyId/audit', async (request) => {
    const { babyId } = request.params as { babyId: string };
    return auditService.list(babyId);
  });
}
