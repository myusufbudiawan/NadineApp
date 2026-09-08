import { randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { testTokenVerifier, testUser } from './helpers/auth.js';

// Section 15 guardrail / 5.2: no sensitive baby/measurement data reaches
// logs by default. Captures everything the server actually writes to its
// log stream while a request carrying sensitive values flows through, then
// asserts none of those raw values appear anywhere in the captured text.
function captureLogs() {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  });
  return { stream, text: () => chunks.join('') };
}

describe('log scrubbing', () => {
  it('never writes a raw temperature value, medication dose, free-text note, or access token to the log stream', async () => {
    const { stream, text } = captureLogs();
    const app = buildServer({ logStream: stream, tokenVerifier: testTokenVerifier });
    const user = testUser();

    const babyResponse = await app.inject({
      method: 'POST',
      url: '/v1/babies',
      headers: user.authHeader,
      payload: {
        name: 'Test Baby',
        sex: 'girl',
        dateOfBirth: new Date('2024-01-01').toISOString(),
        gestationalWeeks: 30,
        gestationalDays: 0,
        birthWeightKg: 1.5,
        fullTermReferenceWeeks: 40,
      },
    });
    const babyId = babyResponse.json().id;

    const secretDose = 493.17;
    const secretTemp = 38.42;
    const secretNote = 'unmistakable-canary-note-xyz987';

    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      headers: user.authHeader,
      payload: {
        type: 'temperature',
        occurredAt: new Date().toISOString(),
        data: { value: secretTemp, unit: 'C', method: 'axillary' },
        notes: secretNote,
        idempotencyKey: randomUUID(),
      },
    });
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/events`,
      headers: user.authHeader,
      payload: {
        type: 'medication',
        occurredAt: new Date().toISOString(),
        data: { medicationName: 'canary-med', dose: secretDose, unit: 'mg' },
        idempotencyKey: randomUUID(),
      },
    });

    await app.close();
    const logged = text();
    expect(logged).not.toContain(String(secretTemp));
    expect(logged).not.toContain(String(secretDose));
    expect(logged).not.toContain(secretNote);
    expect(logged).not.toContain(user.authHeader.Authorization);
  });
});
