import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'El nombre de la categoría es obligatorio.' })
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder los 100 caracteres.'),
  description: z.string().optional(),
  type: z.enum(['ASSET', 'SUPPLY']).optional().default('ASSET'),
  usefulLife: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 0))
    .refine((val) => val >= 0, { message: 'La vida útil debe ser mayor o igual a 0 años.' }),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder los 100 caracteres.')
    .optional(),
  description: z.string().optional(),
  type: z.enum(['ASSET', 'SUPPLY']).optional(),
  usefulLife: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : undefined)),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
