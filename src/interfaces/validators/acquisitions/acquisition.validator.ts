import { z } from 'zod';

export const createAcquisitionSchema = z.object({
  userId: z.string({ required_error: 'La persona que entrega es obligatoria.' }),
  projectId: z.string().nullable().optional(),
  checkoutUserId: z.string().nullable().optional(),
  departureDate: z.string().nullable().optional(),
  type: z.enum(['SUPPLY', 'ASSET']).optional().default('SUPPLY'),
  details: z
    .array(
      z.object({
        supplyId: z.string().nullable().optional(),
        assetId: z.string().nullable().optional(),
        unit: z.string().nullable().optional(),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .optional(),
});

export const updateAcquisitionSchema = createAcquisitionSchema.partial();

export const addAcquisitionDetailSchema = z.object({
  supplyId: z.string().nullable().optional(),
  assetId: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  quantity: z.number().int().min(1).default(1),
});

export const queryAcquisitionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  search: z.string().optional(),
  userId: z.string().optional(),
  projectId: z.string().optional(),
  checkoutUserId: z.string().optional(),
  type: z.enum(['SUPPLY', 'ASSET']).optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
