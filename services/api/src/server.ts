// Must be the first import: ES module imports are evaluated before any
// top-level statement in this file, so loading .env any later would run
// after common/db/client.ts (imported transitively below) already read
// process.env.DATABASE_URL as undefined.
import './env.js';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { registerAuth } from './common/auth/plugin.js';
import { createSupabaseTokenVerifier, TokenVerifier } from './common/auth/verify-token.js';
import { db } from './common/db/client.js';
import { registerErrorHandler } from './common/middleware/error-handler.js';
import { registerRequestId } from './common/middleware/request-id.js';
import { auditService } from './domains/audit/service.js';
import { auditRoutes } from './domains/audit/routes.js';
import { identityRoutes } from './domains/identity/routes.js';
import { babyProfileRoutes } from './domains/baby-profile/routes.js';
import { BabyProfileService } from './domains/baby-profile/service.js';
import { PostgresBabyRepository } from './domains/baby-profile/postgres-repository.js';
import { careEventsRoutes } from './domains/care-events/routes.js';
import { CareEventsService } from './domains/care-events/service.js';
import { PostgresCareEventRepository } from './domains/care-events/postgres-repository.js';
import { growthRoutes } from './domains/growth/routes.js';
import { GrowthService } from './domains/growth/service.js';
import { PostgresGrowthRepository } from './domains/growth/postgres-repository.js';
import { remindersRoutes } from './domains/reminders/routes.js';
import { RemindersService } from './domains/reminders/service.js';
import { PostgresReminderRepository } from './domains/reminders/postgres-repository.js';
import { contentRoutes } from './domains/content/routes.js';
import { ContentService } from './domains/content/service.js';
import { PostgresContentRepository } from './domains/content/postgres-repository.js';
import { sharingRoutes } from './domains/sharing/routes.js';
import { SharingService } from './domains/sharing/service.js';
import { PostgresShareRepository } from './domains/sharing/postgres-repository.js';
import { reportsRoutes } from './domains/reports/routes.js';
import { syncRoutes } from './domains/sync/routes.js';

// `logStream` and `tokenVerifier` are test-only escape hatches: logStream
// lets the log-scrubbing test (5.2) assert on what actually gets written
// instead of trusting the config in isolation; tokenVerifier lets tests mint
// their own fake-but-typed identities instead of needing a real Supabase
// access token signed against the live JWKS endpoint.
export function buildServer(
  options: { logStream?: NodeJS.WritableStream; tokenVerifier?: TokenVerifier } = {},
) {
  // Section 15 guardrail: no sensitive baby/measurement data in logs by
  // default. Fastify's request/response logs never include the body on
  // their own (only method/url/headers/status) — `redact` additionally
  // strips the one header that can carry a secret, and the explicit
  // `serializers` override guarantees nothing is ever added later that
  // would leak a request/response body into the log stream.
  const app = Fastify({
    logger: {
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            hostname: request.hostname,
            remoteAddress: request.ip,
          };
        },
      },
      ...(options.logStream ? { stream: options.logStream } : {}),
    },
  });
  registerErrorHandler(app);
  registerRequestId(app);
  app.register(cors, { origin: true });
  app.get('/health', () => ({ status: 'ok' }));

  const tokenVerifier =
    options.tokenVerifier ?? createSupabaseTokenVerifier(requireEnv('SUPABASE_JWKS_URL'));
  registerAuth(app, tokenVerifier);

  // One instance per domain per running server, shared with every domain
  // that needs to read across a domain boundary (Reports, Privacy) so those
  // reads go through the owning domain's service rather than its repository
  // directly (Constitution 0.A #3). Each buildServer() call still gets a
  // fresh service layer, all backed by the same Postgres pool.
  const babyProfileService = new BabyProfileService(new PostgresBabyRepository(db));
  const careEventsService = new CareEventsService(new PostgresCareEventRepository(db), auditService);
  const growthService = new GrowthService(new PostgresGrowthRepository(db), auditService);
  const remindersService = new RemindersService(new PostgresReminderRepository(db), auditService);
  const sharingService = new SharingService(new PostgresShareRepository(db), auditService);
  const contentService = new ContentService(new PostgresContentRepository(db));

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
  app.register((instance) =>
    careEventsRoutes(instance, { service: careEventsService, babyProfileService, sharingService }),
  );
  app.register((instance) =>
    growthRoutes(instance, { service: growthService, babyProfileService, sharingService }),
  );
  app.register((instance) =>
    remindersRoutes(instance, { service: remindersService, babyProfileService, sharingService }),
  );
  app.register((instance) => contentRoutes(instance, { service: contentService }));
  app.register((instance) => sharingRoutes(instance, { service: sharingService, babyProfileService }));
  app.register((instance) =>
    reportsRoutes(instance, {
      babyProfileService,
      careEventsService,
      growthService,
      sharingService,
      auditService,
    }),
  );
  app.register((instance) =>
    syncRoutes(instance, { careEventsService, babyProfileService, sharingService }),
  );
  app.register((instance) => auditRoutes(instance, { babyProfileService, sharingService }));
  return app;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Vercel imports this module to get `buildServer` but runs it as a
// serverless function (see api/index.ts) rather than a long-lived listener.
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const app = buildServer();
  app
    .listen({ port: Number(process.env.PORT ?? 3000), host: '0.0.0.0' })
    .catch((error) => {
      app.log.error(error);
      process.exit(1);
    });
}
