import { randomUUID } from 'node:crypto';
import { NotFoundError } from '../../common/auth/errors.js';
import { AuditService } from '../audit/service.js';
import { nextOccurrence, previousOccurrence } from '../../common/util/timezone.js';
import { ReminderRepository, StoredReminder } from './repository.js';
import { ReminderInput, ReminderUpdateInput } from './schema.js';

export type ReminderView = StoredReminder & {
  nextFiresAt?: Date;
  // Neutral status only (Section 12) — "missed" here is informational, never
  // shaming copy; the mobile client renders it as "Missed — reschedule".
  missed: boolean;
};

export class RemindersService {
  constructor(
    private repository: ReminderRepository,
    private audit: AuditService,
  ) {}

  private toView(reminder: StoredReminder, now: Date): ReminderView {
    if (!reminder.enabled) return { ...reminder, missed: false };
    if (reminder.status === 'snoozed' && reminder.snoozedUntil && reminder.snoozedUntil > now) {
      return { ...reminder, nextFiresAt: reminder.snoozedUntil, missed: false };
    }
    const next = nextOccurrence(now, reminder.timeOfDay, reminder.daysOfWeek, reminder.timezone);
    const previous = previousOccurrence(
      now,
      reminder.timeOfDay,
      reminder.daysOfWeek,
      reminder.timezone,
    );
    const missed = Boolean(
      previous && (!reminder.lastCompletedAt || reminder.lastCompletedAt < previous),
    );
    return { ...reminder, nextFiresAt: next, missed };
  }

  async list(babyId: string, now = new Date()) {
    const reminders = await this.repository.list(babyId);
    return reminders.map((r) => this.toView(r, now));
  }

  async create(actorId: string, babyId: string, input: ReminderInput) {
    const now = new Date();
    const reminder = await this.repository.create({
      id: randomUUID(),
      babyId,
      type: input.type,
      title: input.title,
      timeOfDay: input.timeOfDay,
      daysOfWeek: input.daysOfWeek,
      timezone: input.timezone,
      enabled: input.enabled,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'create',
      entityType: 'reminder',
      entityId: reminder.id,
    });
    return this.toView(reminder, now);
  }

  private async requireOwned(babyId: string, id: string) {
    const reminder = await this.repository.get(id);
    if (!reminder || reminder.babyId !== babyId) throw new NotFoundError('Reminder not found');
    return reminder;
  }

  async update(actorId: string, babyId: string, id: string, patch: ReminderUpdateInput) {
    const existing = await this.requireOwned(babyId, id);
    const updated = await this.repository.update({
      ...existing,
      ...patch,
      updatedAt: new Date(),
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'update',
      entityType: 'reminder',
      entityId: id,
    });
    return this.toView(updated, new Date());
  }

  async snooze(actorId: string, babyId: string, id: string, minutes: number) {
    const existing = await this.requireOwned(babyId, id);
    const snoozedUntil = new Date(Date.now() + minutes * 60_000);
    const updated = await this.repository.update({
      ...existing,
      status: 'snoozed',
      snoozedUntil,
      updatedAt: new Date(),
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'update',
      entityType: 'reminder',
      entityId: id,
    });
    return this.toView(updated, new Date());
  }

  async complete(actorId: string, babyId: string, id: string) {
    const existing = await this.requireOwned(babyId, id);
    const now = new Date();
    const updated = await this.repository.update({
      ...existing,
      status: 'pending',
      snoozedUntil: undefined,
      lastCompletedAt: now,
      updatedAt: now,
    });
    await this.audit.record({
      actorId,
      babyId,
      action: 'update',
      entityType: 'reminder',
      entityId: id,
    });
    return this.toView(updated, now);
  }
}
