import { z } from 'zod';

export const deleteFileSchema = z.object({
  path: z.string({ required_error: 'La ruta del archivo es obligatoria.' }).min(1),
});

export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
