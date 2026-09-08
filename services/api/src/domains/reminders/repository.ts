import { ReminderType } from './schema.js';

export type ReminderStatus = 'pending' | 'snoozed' | 'completed' | 'missed';

export type StoredReminder = {
  id: string;
  babyId: string;
  type: ReminderType;
  title: string;
  timeOfDay: string;
  daysOfWeek: number[];
  timezone: string;
  enabled: boolean;
  status: ReminderStatus;
  snoozedUntil?: Date;
  lastCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export interface ReminderRepository {
  list(babyId: string): Promise<StoredReminder[]>;
  get(id: string): Promise<StoredReminder | undefined>;
  create(reminder: StoredReminder): Promise<StoredReminder>;
  update(reminder: StoredReminder): Promise<StoredReminder>;
}

export class InMemoryReminderRepository implements ReminderRepository {
  private reminders = new Map<string, StoredReminder>();

  async list(babyId: string) {
    return [...this.reminders.values()].filter((r) => r.babyId === babyId);
  }

  async get(id: string) {
    return this.reminders.get(id);
  }

  async create(reminder: StoredReminder) {
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  async update(reminder: StoredReminder) {
    this.reminders.set(reminder.id, reminder);
    return reminder;
  }
}
