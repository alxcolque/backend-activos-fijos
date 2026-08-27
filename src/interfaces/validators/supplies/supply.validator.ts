import { z } from 'zod';

export const createSupplySchema = z.object({
  name: z
    .string({ required_error: 'El nombre del material es obligatorio.' })
    .min(1, 'El nombre no puede estar vacío.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.'),
  unit: z.string().optional().default('PZA'),
  inputQuantity: z
    .number()
    .int('La cantidad de entrada debe ser un número entero.')
    .gte(0, 'La cantidad no puede ser negativa.')
    .optional()
    .default(0),
  outputQuantity: z
    .number()
    .int('La cantidad de salida debe ser un número entero.')
    .gte(0, 'La cantidad no puede ser negativa.')
    .optional()
    .default(0),
  entryDate: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
});

export const updateSupplySchema = z.object({
  name: z.string().min(1).max(150).optional(),
  unit: z.string().optional(),
  inputQuantity: z.number().int().gte(0).optional(),
  outputQuantity: z.number().int().gte(0).optional(),
  entryDate: z.string().nullable().optional(),
  observations: z.string().nullable().optional(),
});

export const querySupplySchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 20)),
  search: z.string().optional(),
});

export type CreateSupplyInput = z.infer<typeof createSupplySchema>;
export type UpdateSupplyInput = z.infer<typeof updateSupplySchema>;
export type QuerySupplyInput = z.infer<typeof querySupplySchema>;
