import { z } from 'zod';

export const updateSettingsSchema = z.object({
  companyName: z.string().min(1, 'El nombre de la empresa es obligatorio.').optional(),
  nit: z.string().min(1, 'El NIT es obligatorio.').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Debe ser un correo electrónico válido.').optional(),
  currency: z.string().optional(),
  assetPrefix: z.string().max(10, 'El prefijo no puede exceder 10 caracteres.').optional(),
});

export const updateSingleSettingSchema = z.object({
  value: z.string({ required_error: 'El valor es obligatorio.' }),
  description: z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateSingleSettingInput = z.infer<typeof updateSingleSettingSchema>;
