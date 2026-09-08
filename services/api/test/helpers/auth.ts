import { randomUUID } from 'node:crypto';
import { FastifyInstance } from 'fastify';
import { TokenVerifier } from '../../src/common/auth/verify-token.js';

// Tests don't talk to real Supabase Auth — this verifier trusts whatever
// identity the token literally encodes, so tests can mint their own users
// without a network call or a shared signing secret.
export const testTokenVerifier: TokenVerifier = async (token) => {
  const [userId, email] = token.split('::');
  if (!userId || !email) throw new Error('Malformed test token');
  return { userId, email };
};

export function testUser(email = `${randomUUID()}@example.com`) {
  const userId = randomUUID();
  return { userId, email, authHeader: { Authorization: `Bearer ${userId}::${email}` } };
}

export async function createTestBaby(
  app: FastifyInstance,
  headers: Record<string, string>,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const response = await app.inject({
    method: 'POST',
    url: '/v1/babies',
    headers,
    payload: {
      name: 'Test Baby',
      sex: 'girl',
      dateOfBirth: new Date(Date.now() - 30 * 86_400_000).toISOString(),
      gestationalWeeks: 32,
      gestationalDays: 3,
      birthWeightKg: 1.58,
      fullTermReferenceWeeks: 40,
      ...overrides,
    },
  });
  return response.json().id as string;
}
