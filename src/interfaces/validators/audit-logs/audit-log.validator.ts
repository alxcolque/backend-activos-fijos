import { z } from 'zod';

export const queryAuditLogSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  method: z.string().optional(),
  statusCode: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
});

export type QueryAuditLogInput = z.infer<typeof queryAuditLogSchema>;
