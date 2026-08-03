import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio.' })
    .email('Debe proporcionar un correo electrónico válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(1, 'La contraseña es obligatoria.'),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: 'El refresh token es obligatorio.' })
    .min(1, 'El refresh token es obligatorio.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
