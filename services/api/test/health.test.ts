import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
describe('health', () => {
  it('responds', async () => {
    const app = buildServer();
    const response = await app.inject('/health');
    expect(response.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});
