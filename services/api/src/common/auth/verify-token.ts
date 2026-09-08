import { createRemoteJWKSet, jwtVerify } from 'jose';
import { UnauthorizedError } from './errors.js';

export type VerifiedIdentity = { userId: string; email: string };
export type TokenVerifier = (token: string) => Promise<VerifiedIdentity>;

// Verifies an access token issued by Supabase Auth against the project's
// JWKS endpoint (this project uses asymmetric signing keys, not a shared
// HS256 secret, so verification happens against Supabase's public keys
// rather than a value we hold ourselves). `createRemoteJWKSet` caches and
// auto-refreshes the key set, so this only hits the network on cache miss.
export function createSupabaseTokenVerifier(jwksUrl: string): TokenVerifier {
  const jwks = createRemoteJWKSet(new URL(jwksUrl));

  return async (token: string) => {
    try {
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
