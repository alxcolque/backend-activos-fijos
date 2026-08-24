import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z
    .string({ required_error: 'El nombre completo es obligatorio.' })
    .min(2, 'El nombre completo debe tener al menos 2 caracteres.')
    .max(150, 'El nombre no puede exceder 150 caracteres.'),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .email('Debe proporcionar un correo electrónico válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  role: z.enum(['admin', 'operador', 'guest']).optional().default('admin'),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre completo debe tener al menos 2 caracteres.')
    .max(150, 'El nombre no puede exceder 150 caracteres.')
    .optional(),
  email: z.string().email('Debe proporcionar un correo electrónico válido.').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.').optional().or(z.literal('')),
  role: z.enum(['admin', 'operador', 'guest']).optional(),
  isActive: z.boolean().optional(),
});

export const queryUserSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Number(val) : 1)),
  limit: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Number(val) : 10)),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type QueryUserInput = z.infer<typeof queryUserSchema>;
