import cors from '@fastify/cors';
import Fastify from 'fastify';
import { registerErrorHandler } from './common/middleware/error-handler.js';
import { registerRequestId } from './common/middleware/request-id.js';
import { auditService } from './domains/audit/service.js';
import { identityRoutes } from './domains/identity/routes.js';
import { babyProfileRoutes } from './domains/baby-profile/routes.js';
import { BabyProfileService } from './domains/baby-profile/service.js';
import { careEventsRoutes } from './domains/care-events/routes.js';
import { CareEventsService } from './domains/care-events/service.js';
import { InMemoryCareEventRepository } from './domains/care-events/repository.js';
import { growthRoutes } from './domains/growth/routes.js';
import { GrowthService } from './domains/growth/service.js';
import { InMemoryGrowthRepository } from './domains/growth/repository.js';
import { remindersRoutes } from './domains/reminders/routes.js';
import { RemindersService } from './domains/reminders/service.js';
import { InMemoryReminderRepository } from './domains/reminders/repository.js';
import { contentRoutes } from './domains/content/routes.js';
import { sharingRoutes } from './domains/sharing/routes.js';
import { SharingService } from './domains/sharing/service.js';
import { InMemoryShareRepository } from './domains/sharing/repository.js';
import { reportsRoutes } from './domains/reports/routes.js';
import { syncRoutes } from './domains/sync/routes.js';
import { auditRoutes } from './domains/audit/routes.js';

export function buildServer() {
  const app = Fastify({ logger: true });
  registerErrorHandler(app);
  registerRequestId(app);
  app.register(cors, { origin: true });
  app.get('/health', () => ({ status: 'ok' }));

  // One instance per domain per running server, shared with every domain
  // that needs to read across a domain boundary (Reports, Privacy) so those
  // reads go through the owning domain's service rather than its repository
  // directly (Constitution 0.A #3). Each buildServer() call still gets a
  // fresh, isolated set — no state leaks between servers/tests.
  const babyProfileService = new BabyProfileService();
  const careEventsService = new CareEventsService(new InMemoryCareEventRepository(), auditService);
  const growthService = new GrowthService(new InMemoryGrowthRepository(), auditService);
  const remindersService = new RemindersService(new InMemoryReminderRepository(), auditService);
  const sharingService = new SharingService(new InMemoryShareRepository(), auditService);

  app.register((instance) =>
    identityRoutes(instance, {
      babyProfileService,
      careEventsService,
      growthService,
      remindersService,
      sharingService,
    }),
  );
  app.register((instance) => babyProfileRoutes(instance, { service: babyProfileService }));
  app.register((instance) => careEventsRoutes(instance, { service: careEventsService }));
  app.register((instance) => growthRoutes(instance, { service: growthService }));
  app.register((instance) => remindersRoutes(instance, { service: remindersService }));
  app.register(contentRoutes);
  app.register((instance) => sharingRoutes(instance, { service: sharingService }));
  app.register((instance) =>
    reportsRoutes(instance, { babyProfileService, careEventsService, growthService }),
  );
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
