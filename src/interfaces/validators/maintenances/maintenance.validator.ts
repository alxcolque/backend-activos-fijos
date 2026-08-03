import { z } from 'zod';
import { MaintenanceType } from '@prisma/client';

export const createMaintenanceSchema = z.object({
  assetId: z
    .string({ required_error: 'El ID del activo es obligatorio.' })
    .min(1, 'El ID del activo es obligatorio.'),
  type: z.nativeEnum(MaintenanceType).optional().default(MaintenanceType.PREVENTIVE),
  maintenanceDate: z
    .string({ required_error: 'La fecha de mantenimiento es obligatoria.' })
    .min(1, 'La fecha de mantenimiento es obligatoria.'),
  provider: z
    .string()
    .max(120, 'El proveedor no puede exceder los 120 caracteres.')
    .nullable()
    .optional(),
  cost: z
    .number()
    .gte(0, 'El costo debe ser mayor o igual a cero.')
    .nullable()
    .optional()
    .default(0),
  nextMaintenance: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
});

export const updateMaintenanceSchema = z.object({
  type: z.nativeEnum(MaintenanceType).optional(),
  maintenanceDate: z.string().optional(),
  provider: z
    .string()
    .max(120, 'El proveedor no puede exceder los 120 caracteres.')
    .nullable()
    .optional(),
  cost: z
    .number()
    .gte(0, 'El costo debe ser mayor o igual a cero.')
    .nullable()
    .optional(),
  nextMaintenance: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
});

export const queryMaintenanceSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  type: z.nativeEnum(MaintenanceType).optional(),
  assetId: z.string().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
export type QueryMaintenanceInput = z.infer<typeof queryMaintenanceSchema>;
