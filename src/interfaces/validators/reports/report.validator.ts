import { z } from 'zod';
import { MaintenanceType } from '../../../domain/enums/maintenance-type.enum';

export const reportQuerySchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  projectId: z.string().optional(),
  type: z.nativeEnum(MaintenanceType).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  year: z.string().optional().transform((val) => (val ? parseInt(val, 10) : new Date().getFullYear())),
  activeOnly: z.string().optional().transform((val) => val === 'true'),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
