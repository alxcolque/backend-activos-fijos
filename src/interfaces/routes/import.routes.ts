import { FastifyInstance } from 'fastify';
import { ImportController } from '../controllers/import.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function importRoutes(fastify: FastifyInstance) {
  // Cargar e importar Excel
  fastify.post(
    '/excel',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Importar masivamente activos fijos desde archivo Excel o lote JSON',
        tags: ['Importación Excel'],
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Importación masiva completada.' },
              data: {
                type: 'object',
                properties: {
                  totalRows: { type: 'number' },
                  importedCount: { type: 'number' },
                  failedCount: { type: 'number' },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        row: { type: 'number' },
                        code: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    ImportController.importExcel,
  );

  // Obtener plantilla de importación
  fastify.get(
    '/template',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener la estructura de columnas de la plantilla de importación Excel',
        tags: ['Importación Excel'],
        security: [{ bearerAuth: [] }],
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
    ImportController.getTemplate,
  );
}
