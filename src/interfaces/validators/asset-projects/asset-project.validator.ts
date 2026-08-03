import { z } from 'zod';

export const assignAssetSchema = z.object({
  assetId: z
    .string({ required_error: 'El ID del activo es obligatorio.' })
    .min(1, 'El ID del activo es obligatorio.'),
  projectId: z
    .string({ required_error: 'El ID del proyecto es obligatorio.' })
    .min(1, 'El ID del proyecto es obligatorio.'),
  observations: z.string().optional(),
});

export const releaseAssetSchema = z.object({
  assetId: z
    .string({ required_error: 'El ID del activo es obligatorio.' })
    .min(1, 'El ID del activo es obligatorio.'),
  projectId: z
    .string({ required_error: 'El ID del proyecto es obligatorio.' })
    .min(1, 'El ID del proyecto es obligatorio.'),
  observations: z.string().optional(),
});

export const queryAssetProjectSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  projectId: z.string().optional(),
  assetId: z.string().optional(),
  activeOnly: z.string().optional().transform((val) => val === 'true'),
});

export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type ReleaseAssetInput = z.infer<typeof releaseAssetSchema>;
export type QueryAssetProjectInput = z.infer<typeof queryAssetProjectSchema>;
