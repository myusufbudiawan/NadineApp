import { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
export function registerRequestId(app: FastifyInstance) {
  app.addHook('onRequest', async (request, reply) => {
    const id = request.headers['x-request-id']?.toString() ?? randomUUID();
    reply.header('x-request-id', id);
  });
}
