import { z } from 'zod';
export const auditSchema = z.object({
  entityType: z.string(),
  entityId: z.string().uuid(),
  action: z.enum(['create', 'update', 'delete']),
});
