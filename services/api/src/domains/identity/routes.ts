import { FastifyInstance } from 'fastify';
import { sessionSchema } from './schema.js';
import { IdentityService } from './service.js';
export async function identityRoutes(app: FastifyInstance) {
  const service = new IdentityService();
  app.post('/v1/auth/session', async (request) =>
    service.createOrRefreshSession(sessionSchema.parse(request.body).email),
  );
}
