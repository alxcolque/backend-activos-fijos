import { z } from 'zod';

export const createStatusSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del estado es obligatorio.' })
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder los 100 caracteres.'),
  description: z.string().optional(),
});

export const updateStatusSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede exceder los 100 caracteres.')
    .optional(),
  description: z.string().optional(),
});

export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
