import { FastifyInstance, FastifyRequest } from 'fastify';
import { UnauthorizedError } from './errors.js';
import { TokenVerifier } from './verify-token.js';

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    userEmail: string;
  }
}

// Every route requires a valid Supabase access token except the small
// allowlist below. Applied as a global onRequest hook so no route can be
// added later and accidentally skip authentication.
const PUBLIC_ROUTES = new Set(['/health']);

export function registerAuth(app: FastifyInstance, verify: TokenVerifier) {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    if (PUBLIC_ROUTES.has(request.routeOptions.url ?? request.url)) return;

    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedError();
    const token = header.slice('Bearer '.length);

    // Never log the raw token or decoded payload — request logging in
    // server.ts already redacts the Authorization header, and this hook
    // must not undo that by passing the token anywhere it could be logged.
    const identity = await verify(token);
    request.userId = identity.userId;
    request.userEmail = identity.email;
  });
}
