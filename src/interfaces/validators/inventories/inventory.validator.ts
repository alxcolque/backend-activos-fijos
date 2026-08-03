import { z } from 'zod';
import { InventoryStatus } from '@prisma/client';

export const createInventorySchema = z.object({
  name: z
    .string({ required_error: 'El nombre de la campaña es obligatorio.' })
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.'),
  inventoryDate: z.string({ required_error: 'La fecha de inventario es obligatoria.' }),
  locationId: z
    .string({ required_error: 'La ubicación es obligatoria.' })
    .min(1, 'La ubicación es obligatoria.'),
  observations: z.string().nullable().optional(),
});

export const registerInventoryItemSchema = z.object({
  assetId: z
    .string({ required_error: 'El ID del activo es obligatorio.' })
    .min(1, 'El ID del activo es obligatorio.'),
  status: z.nativeEnum(InventoryStatus).optional().default(InventoryStatus.FOUND),
  observations: z.string().nullable().optional(),
});

export const queryInventorySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  locationId: z.string().optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type RegisterInventoryItemInput = z.infer<typeof registerInventoryItemSchema>;
export type QueryInventoryInput = z.infer<typeof queryInventorySchema>;
