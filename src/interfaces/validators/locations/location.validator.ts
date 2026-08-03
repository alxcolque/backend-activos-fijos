import { z } from 'zod';

export const createLocationSchema = z.object({
  parentId: z.string().nullable().optional(),
  name: z
    .string({ required_error: 'El nombre de la ubicación es obligatorio.' })
    .min(1, 'El nombre de la ubicación es obligatorio.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.'),
  description: z.string().optional(),
});

export const updateLocationSchema = z.object({
  parentId: z.string().nullable().optional(),
  name: z
    .string()
    .min(1, 'El nombre de la ubicación es obligatorio.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.')
    .optional(),
  description: z.string().optional(),
});

export const queryLocationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type QueryLocationInput = z.infer<typeof queryLocationSchema>;
