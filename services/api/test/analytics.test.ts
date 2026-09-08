import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  AnalyticsRejectedError,
  trackEvent,
} from '../src/common/analytics/events.js';

describe('analytics allowlist', () => {
  it('accepts an allowlisted, category-only event', () => {
    const event = trackEvent({
      name: 'event_type_logged',
      babyId: randomUUID(),
      category: 'feeding',
    });
    expect(event.name).toBe('event_type_logged');
  });

  it('rejects an event carrying a raw measurement value', () => {
    expect(() =>
      trackEvent({
        name: 'event_type_logged',
        babyId: randomUUID(),
        category: 'weight',
        // A raw value has no allowlisted field to travel in — this must fail.
        value: 1.68,
      }),
    ).toThrow(AnalyticsRejectedError);
  });

  it('rejects an event carrying free-form notes', () => {
    expect(() =>
      trackEvent({
        name: 'event_type_logged',
        babyId: randomUUID(),
        category: 'note',
        notes: 'Baby seemed fussy after feeding',
      }),
    ).toThrow(AnalyticsRejectedError);
  });

  it('rejects an event name that is not on the allowlist', () => {
    expect(() => trackEvent({ name: 'baby_weight_recorded', value: 1.68 })).toThrow(
      AnalyticsRejectedError,
    );
  });

  it('rejects a medication event carrying dose information', () => {
    expect(() =>
      trackEvent({
        name: 'event_type_logged',
        babyId: randomUUID(),
        category: 'medication',
        dose: 400,
        medicationName: 'Vitamin D',
      }),
    ).toThrow(AnalyticsRejectedError);
  });
});
