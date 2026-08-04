import { z } from 'zod';
import { DocumentType } from '@prisma/client';

export const createDocumentSchema = z.object({
  assetId: z
    .string({ required_error: 'El ID del activo es obligatorio.' })
    .min(1, 'El ID del activo es obligatorio.'),
  type: z.nativeEnum(DocumentType).optional().default(DocumentType.OTHER),
  fileName: z
    .string({ required_error: 'El nombre del archivo es obligatorio.' })
    .min(1, 'El nombre del archivo es obligatorio.'),
  originalName: z
    .string({ required_error: 'El nombre original es obligatorio.' })
    .min(1, 'El nombre original es obligatorio.'),
  mimeType: z
    .string({ required_error: 'El tipo MIME es obligatorio.' })
    .min(1, 'El tipo MIME es obligatorio.'),
  extension: z
    .string({ required_error: 'La extensión del archivo es obligatoria.' })
    .min(1, 'La extensión del archivo es obligatoria.'),
  size: z
    .number({ required_error: 'El tamaño del archivo es obligatorio.' })
    .int()
    .gt(0, 'El tamaño debe ser mayor a cero.'),
  path: z
    .string({ required_error: 'La ruta del archivo es obligatoria.' })
    .min(1, 'La ruta del archivo es obligatoria.'),
  description: z.string().optional(),
});

export const queryDocumentSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val != null ? Number(val) : 20)),
  search: z.string().optional(),
  type: z.nativeEnum(DocumentType).optional(),
  assetId: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type QueryDocumentInput = z.infer<typeof queryDocumentSchema>;
