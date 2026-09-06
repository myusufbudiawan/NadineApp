import { randomUUID } from 'node:crypto';
export class IdentityService {
  async createOrRefreshSession(email: string) {
    return {
      accessToken: randomUUID(),
      refreshToken: randomUUID(),
      expiresInSeconds: 900,
      user: { id: randomUUID(), email },
    };
  }
}
