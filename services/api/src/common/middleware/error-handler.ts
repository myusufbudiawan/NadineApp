import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError)
      return reply
        .status(400)
        .send({ error: 'Validation failed', details: error.flatten() });
    app.log.error(error);
    return reply.status(500).send({ error: 'Unexpected server error' });
  });
}
