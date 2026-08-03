import { z } from 'zod';
import { ProjectType, ProjectStatus } from '@prisma/client';

export const createProjectSchema = z.object({
  code: z
    .string({ required_error: 'El código del proyecto es obligatorio.' })
    .min(1, 'El código del proyecto es obligatorio.')
    .max(30, 'El código no puede exceder los 30 caracteres.'),
  name: z
    .string({ required_error: 'El nombre del proyecto es obligatorio.' })
    .min(1, 'El nombre del proyecto es obligatorio.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.'),
  type: z.nativeEnum(ProjectType).optional().default(ProjectType.ADMINISTRATIVE),
  status: z.nativeEnum(ProjectStatus).optional().default(ProjectStatus.ACTIVE),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const updateProjectSchema = z.object({
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
  type: z.nativeEnum(ProjectType).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export const queryProjectSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  type: z.nativeEnum(ProjectType).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  sortBy: z.enum(['name', 'code', 'startDate', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type QueryProjectInput = z.infer<typeof queryProjectSchema>;
