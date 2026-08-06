import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('mysql://root:root@localhost:3307/activos_fijos'),
  JWT_SECRET: z.string().default('change_this_secret'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_PATH: z.string().default('uploads'),
  MAX_UPLOAD_SIZE: z.string().default('10485760').transform((val) => parseInt(val, 10)),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  TZ: z.string().default('America/La_Paz'),
});

export const env = envSchema.parse(process.env);

// Establecer zona horaria UTC-4 (Hora de Bolivia) a nivel global en el proceso Node.js
process.env.TZ = env.TZ;
