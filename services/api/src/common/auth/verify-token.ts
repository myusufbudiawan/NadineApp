import { UnauthorizedError } from './errors.js';

export type VerifiedIdentity = { userId: string; email: string };
export type TokenVerifier = (token: string) => Promise<VerifiedIdentity>;

function loadJose() {
  return import('jose');
}

// Verifies an access token issued by Supabase Auth against the project's
// JWKS endpoint (this project uses asymmetric signing keys, not a shared
// HS256 secret, so verification happens against Supabase's public keys
// rather than a value we hold ourselves). `createRemoteJWKSet` caches and
// auto-refreshes the key set, so this only hits the network on cache miss.
//
// jose is ESM-only. Vercel's serverless bundler doesn't reliably honor this
// package's "type": "module" for every function it transpiles, and has
// crashed with ERR_REQUIRE_ESM when this was a static import compiled down
// to require(). A dynamic import() works under both CJS and ESM output, so
// it sidesteps the bundler's format choice entirely.
export function createSupabaseTokenVerifier(jwksUrl: string): TokenVerifier {
  let jwks: ReturnType<Awaited<ReturnType<typeof loadJose>>['createRemoteJWKSet']> | undefined;

  return async (token: string) => {
    try {
      const { createRemoteJWKSet, jwtVerify } = await loadJose();
      jwks ??= createRemoteJWKSet(new URL(jwksUrl));
      const { payload } = await jwtVerify(token, jwks);
      if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
        throw new UnauthorizedError();
      }
      return { userId: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedError();
    }
  };
}
