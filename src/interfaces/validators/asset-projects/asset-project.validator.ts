import { z } from 'zod';

export const assignAssetSchema = z.object({
  assetId: z
    .string({ required_error: 'El ID del activo es obligatorio.' })
    .min(1, 'El ID del activo es obligatorio.'),
  projectId: z
    .string({ required_error: 'El ID del proyecto es obligatorio.' })
    .min(1, 'El ID del proyecto es obligatorio.'),
  quantity: z.number().int().gt(0).optional().default(1),
  observations: z.string().optional(),
});

export const releaseAssetSchema = z.object({
  assignmentId: z.string().optional(),
  assetId: z.string().optional(),
  projectId: z.string().optional(),
  quantityToRelease: z.number().int().gt(0).optional(),
  observations: z.string().optional(),
});

export const queryAssetProjectSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 20)),
  projectId: z.string().optional(),
  assetId: z.string().optional(),
  activeOnly: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => val === true || val === 'true'),
});

export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type ReleaseAssetInput = z.infer<typeof releaseAssetSchema>;
export type QueryAssetProjectInput = z.infer<typeof queryAssetProjectSchema>;
