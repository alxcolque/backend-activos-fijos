import { z } from 'zod';

export const createAcquisitionSchema = z.object({
  userId: z.string().uuid('El ID de usuario es inválido.'),
  projectUserId: z.string().uuid('El ID de usuario de proyecto es inválido.').nullable().optional(),
  checkoutUserId: z.string().uuid('El ID de usuario que retira es inválido.').nullable().optional(),
  departureDate: z.string().nullable().optional(),
  details: z.array(
    z.object({
      projectId: z.string().uuid('El ID del proyecto es inválido.').nullable().optional(),
      unit: z.string().nullable().optional(),
      quantity: z.number().int().min(1).default(1),
    })
  ).optional(),
});

export const updateAcquisitionSchema = createAcquisitionSchema.partial();

export const queryAcquisitionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  projectUserId: z.string().uuid().optional(),
  checkoutUserId: z.string().uuid().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
