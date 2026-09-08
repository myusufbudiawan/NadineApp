import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { HttpError } from '../auth/errors.js';
export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError)
      return reply
        .status(400)
        .send({ error: 'Validation failed', details: error.flatten() });
    if (error instanceof HttpError)
      return reply.status(error.status).send({ error: error.message });
    app.log.error(error);
    return reply.status(500).send({ error: 'Unexpected server error' });
  });
}
