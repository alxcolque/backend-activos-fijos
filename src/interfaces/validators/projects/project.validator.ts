import { z } from 'zod';
import { ProjectStatus } from '../../../domain/enums/project-status.enum';

const assignedAssetItemSchema = z.object({
  assetId: z.string().min(1, 'El ID del activo es obligatorio.'),
  quantity: z.number().int().gt(0, 'La cantidad asignada debe ser mayor a 0.').default(1),
  observations: z.string().optional(),
});

export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del proyecto es obligatorio.' })
    .min(1, 'El nombre del proyecto es obligatorio.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.'),
  address: z.string().nullable().optional(),
  responsible: z.string().nullable().optional(),
  status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.ACTIVE),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  assignedAssets: z.array(assignedAssetItemSchema).optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre no puede estar vacío.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.')
    .optional(),
  address: z.string().nullable().optional(),
  responsible: z.string().nullable().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  assignedAssets: z.array(assignedAssetItemSchema).optional(),
});

export const queryProjectSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 20)),
  search: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  sortBy: z.enum(['name', 'startDate', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type QueryProjectInput = z.infer<typeof queryProjectSchema>;
