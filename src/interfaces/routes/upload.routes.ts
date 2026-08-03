import { FastifyInstance } from 'fastify';
import { UploadController } from '../controllers/upload.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function uploadRoutes(fastify: FastifyInstance) {
  // Cargar archivo
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Cargar un archivo binario (fotografía o documento) al servidor',
        tags: ['Almacenamiento de Archivos'],
        security: [{ bearerAuth: [] }],
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Archivo subido exitosamente.' },
              data: {
                type: 'object',
                properties: {
                  fileName: { type: 'string' },
                  originalName: { type: 'string' },
                  mimeType: { type: 'string' },
                  extension: { type: 'string' },
                  size: { type: 'number' },
                  path: { type: 'string' },
                  url: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    UploadController.uploadFile,
  );

  // Eliminar archivo
  fastify.delete(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar físicamente un archivo almacenado en el servidor',
        tags: ['Almacenamiento de Archivos'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['path'],
          properties: {
            path: { type: 'string', example: 'uploads/photos/a1b2c3d4-compresora.jpg' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Archivo eliminado correctamente.' },
            },
          },
        },
      },
    },
    UploadController.deleteFile,
  );
}
