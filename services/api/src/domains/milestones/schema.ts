import { z } from 'zod';

// milestoneId is a free-form string, not a server-side enum: the set of
// milestones (features/milestones/types.ts) lives entirely on the mobile
// client and can grow there without a server migration. The server only
// ever stores and echoes back whatever id it's given.
export const milestoneSchema = z.object({
  milestoneId: z.string().min(1).max(64),
  achievedAt: z.coerce.date(),
  celebrated: z.boolean().optional().default(false),
});

export type MilestoneInput = z.infer<typeof milestoneSchema>;
