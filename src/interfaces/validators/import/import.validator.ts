import { z } from 'zod';

export const importRowSchema = z.object({
  code: z.string({ required_error: 'El código es obligatorio.' }).min(1),
  name: z.string({ required_error: 'El nombre es obligatorio.' }).min(1),
  category: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  serialNumber: z.string().nullable().optional(),
  unit: z.string().optional().default('PZA'),
  quantity: z.number().optional().default(1),
  purchaseDate: z.string().nullable().optional(),
  purchaseValue: z.number({ required_error: 'El valor de compra es obligatorio.' }).gte(0),
  usefulLife: z.number({ required_error: 'La vida útil es obligatoria.' }).gt(0),
  observations: z.string().nullable().optional(),
});

export const importPayloadSchema = z.object({
  rows: z.array(importRowSchema).min(1, 'Debe incluir al menos un registro para importar.'),
});

export type ImportRowInput = z.infer<typeof importRowSchema>;
export type ImportPayloadInput = z.infer<typeof importPayloadSchema>;
