import { z } from 'zod';

export const assignCustodianSchema = z.object({
  assetId: z
    .string({ required_error: 'El ID del activo es obligatorio.' })
    .min(1, 'El ID del activo es obligatorio.'),
  responsibleName: z
    .string({ required_error: 'El nombre del responsable es obligatorio.' })
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(150, 'El nombre no puede exceder los 150 caracteres.'),
  position: z
    .string()
    .max(100, 'El cargo no puede exceder los 100 caracteres.')
    .optional(),
  observations: z.string().optional(),
});

export const returnAssetSchema = z.object({
  assetId: z
    .string({ required_error: 'El ID del activo es obligatorio.' })
    .min(1, 'El ID del activo es obligatorio.'),
  observations: z.string().optional(),
});

export const queryAssignmentSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  assetId: z.string().optional(),
  activeOnly: z.string().optional().transform((val) => val === 'true'),
});

export type AssignCustodianInput = z.infer<typeof assignCustodianSchema>;
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
export type QueryAssignmentInput = z.infer<typeof queryAssignmentSchema>;
