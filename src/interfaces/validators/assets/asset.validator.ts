import { z } from 'zod';

export const createAssetSchema = z.object({
  code: z
    .string({ required_error: 'El código del activo es obligatorio.' })
    .min(1, 'El código del activo es obligatorio.')
    .max(30, 'El código no puede exceder los 30 caracteres.'),
  name: z
    .string({ required_error: 'El nombre del activo es obligatorio.' })
    .min(1, 'El nombre del activo es obligatorio.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.'),
  description: z.string().nullable().optional(),
  categoryId: z
    .string({ required_error: 'La categoría es obligatoria.' })
    .min(1, 'La categoría es obligatoria.'),
  statusId: z
    .string({ required_error: 'El estado es obligatorio.' })
    .min(1, 'El estado es obligatorio.'),
  locationId: z
    .string({ required_error: 'La ubicación es obligatoria.' })
    .min(1, 'La ubicación es obligatoria.'),
  brand: z.string().max(80, 'La marca no puede exceder los 80 caracteres.').nullable().optional(),
  model: z.string().max(80, 'El modelo no puede exceder los 80 caracteres.').nullable().optional(),
  serialNumber: z
    .string()
    .max(120, 'El número de serie no puede exceder los 120 caracteres.')
    .nullable()
    .optional(),
  unit: z.string().optional().default('PZA'),
  quantity: z
    .number({ required_error: 'La cantidad es obligatoria.' })
    .int('La cantidad debe ser un número entero.')
    .gt(0, 'La cantidad debe ser mayor a cero.'),
  purchaseDate: z.string().nullable().optional(),
  purchaseYear: z.number().int().optional(),
  purchaseValue: z
    .number({ required_error: 'El valor de compra es obligatorio.' })
    .gte(0, 'El valor de compra debe ser mayor o igual a cero.'),
  usefulLife: z
    .number({ required_error: 'La vida útil es obligatoria.' })
    .int('La vida útil debe ser un número entero.')
    .gt(0, 'La vida útil debe ser mayor a cero.'),
  residualValue: z
    .number()
    .gte(0, 'El valor residual debe ser mayor o igual a cero.')
    .nullable()
    .optional(),
  currentValue: z
    .number()
    .gte(0, 'El valor actual debe ser mayor o igual a cero.')
    .nullable()
    .optional(),
  observations: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
});

export const updateAssetSchema = z.object({
  code: z
    .string()
    .min(1, 'El código no puede estar vacío.')
    .max(30, 'El código no puede exceder los 30 caracteres.')
    .optional(),
  name: z
    .string()
    .min(1, 'El nombre no puede estar vacío.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.')
    .optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().optional(),
  statusId: z.string().optional(),
  locationId: z.string().optional(),
  brand: z.string().max(80, 'La marca no puede exceder los 80 caracteres.').nullable().optional(),
  model: z.string().max(80, 'El modelo no puede exceder los 80 caracteres.').nullable().optional(),
  serialNumber: z
    .string()
    .max(120, 'El número de serie no puede exceder los 120 caracteres.')
    .nullable()
    .optional(),
  unit: z.string().optional(),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero.')
    .gt(0, 'La cantidad debe ser mayor a cero.')
    .optional(),
  purchaseDate: z.string().nullable().optional(),
  purchaseYear: z.number().int().optional(),
  purchaseValue: z
    .number()
    .gte(0, 'El valor de compra debe ser mayor o igual a cero.')
    .optional(),
  usefulLife: z
    .number()
    .int('La vida útil debe ser un número entero.')
    .gt(0, 'La vida útil debe ser mayor a cero.')
    .optional(),
  residualValue: z
    .number()
    .gte(0, 'El valor residual debe ser mayor o igual a cero.')
    .nullable()
    .optional(),
  currentValue: z
    .number()
    .gte(0, 'El valor actual debe ser mayor o igual a cero.')
    .nullable()
    .optional(),
  observations: z.string().nullable().optional(),
  photo: z.string().nullable().optional(),
});

export const queryAssetSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  location: z.string().optional(),
  sortBy: z.enum(['code', 'name', 'purchaseDate', 'purchaseValue', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type QueryAssetInput = z.infer<typeof queryAssetSchema>;
