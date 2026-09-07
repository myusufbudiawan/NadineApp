import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';

const babyId = randomUUID();

function reminderPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    type: 'feeding',
    title: 'Feed baby',
    timeOfDay: '09:00',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    timezone: 'UTC',
    enabled: true,
    ...overrides,
  };
}

describe('reminders', () => {
  let app: ReturnType<typeof buildServer>;

  beforeEach(() => {
    app = buildServer();
  });

  it('creates and lists a reminder with a computed next-fire time', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reminders`,
      payload: reminderPayload(),
    });
    expect(create.statusCode).toBe(201);
    expect(create.json()).toMatchObject({ title: 'Feed baby', status: 'pending' });
    expect(create.json().nextFiresAt).toBeTruthy();

    const list = await app.inject({ method: 'GET', url: `/v1/babies/${babyId}/reminders` });
    expect(list.json()).toHaveLength(1);
  });

  it('edits a reminder', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reminders`,
      payload: reminderPayload(),
    });
    const id = create.json().id;

    const update = await app.inject({
      method: 'PATCH',
      url: `/v1/babies/${babyId}/reminders/${id}`,
      payload: { title: 'Feed baby (updated)' },
    });
    expect(update.json().title).toBe('Feed baby (updated)');
  });

  it('snoozes a reminder', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reminders`,
      payload: reminderPayload(),
    });
    const id = create.json().id;

    const snooze = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reminders/${id}/snooze`,
      payload: { minutes: 15 },
    });
    expect(snooze.json().status).toBe('snoozed');
    expect(snooze.json().missed).toBe(false);
  });

  it('completing a reminder clears missed status', async () => {
    // A reminder scheduled for a time already past today should be missed
    // until completed.
    const pastTimeOfDay = new Date(Date.now() - 60_000)
      .toISOString()
      .slice(11, 16);
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reminders`,
      payload: reminderPayload({ timeOfDay: pastTimeOfDay }),
    });
    expect(create.json().missed).toBe(true);

    const id = create.json().id;
    const complete = await app.inject({
      method: 'POST',
      url: `/v1/babies/${babyId}/reminders/${id}/complete`,
    });
    expect(complete.json().missed).toBe(false);
    expect(complete.json().lastCompletedAt).toBeTruthy();
  });

  it('records audit entries for create and complete', async () => {
    // A fresh babyId per test, since AuditService is a process-wide singleton
    // shared across tests within this file (same pattern as growth.test.ts).
    const freshBabyId = randomUUID();
    const create = await app.inject({
      method: 'POST',
      url: `/v1/babies/${freshBabyId}/reminders`,
      payload: reminderPayload(),
    });
    await app.inject({
      method: 'POST',
      url: `/v1/babies/${freshBabyId}/reminders/${create.json().id}/complete`,
    });

    const audit = await app.inject({ method: 'GET', url: `/v1/babies/${freshBabyId}/audit` });
    const entityTypes = audit.json().map((entry: { entityType: string }) => entry.entityType);
    expect(entityTypes.filter((t: string) => t === 'reminder')).toHaveLength(2);
  });
});
