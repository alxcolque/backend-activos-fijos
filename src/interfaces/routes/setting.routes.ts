import { FastifyInstance } from 'fastify';
import { SettingController } from '../controllers/setting.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function settingRoutes(fastify: FastifyInstance) {
  // Obtener configuraciones globales
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener todas las configuraciones institucionales del sistema',
        tags: ['Configuración Global'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'object',
                properties: {
                  companyName: { type: 'string' },
                  nit: { type: 'string' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  currency: { type: 'string' },
                  assetPrefix: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    SettingController.getSettings,
  );

  // Actualizar configuraciones globales
  fastify.put(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar parámetros de configuración institucional en lote',
        tags: ['Configuración Global'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            companyName: { type: 'string', example: 'CORPORACION MINERA DE BOLIVIA - COMIBOL' },
            nit: { type: 'string', example: '1020304050' },
            address: { type: 'string', example: 'Av. 16 de Julio N° 1616, La Paz - Bolivia' },
            phone: { type: 'string', example: '+591 (2) 231-2000' },
            email: { type: 'string', example: 'contacto@comibol.gob.bo' },
            currency: { type: 'string', example: 'BOB' },
            assetPrefix: { type: 'string', example: 'AF' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Configuración institucional actualizada exitosamente.' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    SettingController.updateSettings,
  );

  // Obtener por Clave (Debe ir al final)
  fastify.get(
    '/:key',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener el valor de una clave específica de configuración',
        tags: ['Configuración Global'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    SettingController.getSettingByKey,
  );

  // Actualizar clave específica
  fastify.put(
    '/:key',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Actualizar el valor de una clave específica de configuración',
        tags: ['Configuración Global'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['value'],
          properties: {
            value: { type: 'string' },
            description: { type: 'string', nullable: true },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
    SettingController.updateSingleSetting,
  );
}
