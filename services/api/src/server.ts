import cors from '@fastify/cors';
import Fastify from 'fastify';
import { registerErrorHandler } from './common/middleware/error-handler.js';
import { registerRequestId } from './common/middleware/request-id.js';
import { identityRoutes } from './domains/identity/routes.js';
import { babyProfileRoutes } from './domains/baby-profile/routes.js';
import { careEventsRoutes } from './domains/care-events/routes.js';
import { growthRoutes } from './domains/growth/routes.js';
import { remindersRoutes } from './domains/reminders/routes.js';
import { contentRoutes } from './domains/content/routes.js';
import { sharingRoutes } from './domains/sharing/routes.js';
import { reportsRoutes } from './domains/reports/routes.js';
import { syncRoutes } from './domains/sync/routes.js';
import { auditRoutes } from './domains/audit/routes.js';
export function buildServer() {
  const app = Fastify({ logger: true });
  registerErrorHandler(app);
  registerRequestId(app);
  app.register(cors, { origin: true });
  app.get('/health', () => ({ status: 'ok' }));
  app.register(identityRoutes);
  app.register(babyProfileRoutes);
  app.register(careEventsRoutes);
  app.register(growthRoutes);
  app.register(remindersRoutes);
  app.register(contentRoutes);
  app.register(sharingRoutes);
  app.register(reportsRoutes);
  app.register(syncRoutes);
  app.register(auditRoutes);
  return app;
}
if (process.env.NODE_ENV !== 'test') {
  const app = buildServer();
  app
    .listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
    .catch((error) => {
      app.log.error(error);
      process.exit(1);
    });
}
