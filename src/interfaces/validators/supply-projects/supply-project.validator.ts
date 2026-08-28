import { z } from 'zod';

export const assignSupplyProjectSchema = z
  .object({
    supplyId: z.string({ required_error: 'El id del suministro es obligatorio.' }).min(1),
    projectId: z.string({ required_error: 'El id del proyecto es obligatorio.' }).min(1),
    quantity: z
      .number()
      .int('La cantidad debe ser un número entero.')
      .gt(0, 'La cantidad debe ser mayor a 0.')
      .optional()
      .default(1),
    outputQuantity: z
      .number()
      .int('La cantidad de salida debe ser un número entero.')
      .min(0, 'La cantidad de salida no puede ser negativa.')
      .optional()
      .default(0),
    observations: z.string().nullable().optional(),
  })
  .refine((data) => (data.outputQuantity ?? 0) <= (data.quantity ?? 1), {
    message: 'La cantidad de salida del proyecto no puede superar la cantidad total asignada.',
    path: ['outputQuantity'],
  });

export const releaseSupplyProjectSchema = z.object({
  quantityToRelease: z.number().int().gt(0).optional(),
  observations: z.string().nullable().optional(),
});

export type AssignSupplyProjectInput = z.infer<typeof assignSupplyProjectSchema>;
export type ReleaseSupplyProjectInput = z.infer<typeof releaseSupplyProjectSchema>;
