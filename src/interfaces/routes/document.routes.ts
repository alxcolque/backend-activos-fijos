import { FastifyInstance } from 'fastify';
import { DocumentController } from '../controllers/document.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function documentRoutes(fastify: FastifyInstance) {
  // Asociar documento a activo
  fastify.post(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Asociar metadatos de un archivo o documento a un activo fijo',
        tags: ['Gestión Documental'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['assetId', 'fileName', 'originalName', 'mimeType', 'extension', 'size', 'path'],
          properties: {
            assetId: { type: 'string', example: 'uuid-activo' },
            type: {
              type: 'string',
              enum: ['PHOTO', 'MANUAL', 'INVOICE', 'WARRANTY', 'REPORT', 'OTHER'],
              default: 'OTHER',
            },
            fileName: { type: 'string', example: 'factura-compresora-2025.pdf' },
            originalName: { type: 'string', example: 'Factura_Compra_Atlas.pdf' },
            mimeType: { type: 'string', example: 'application/pdf' },
            extension: { type: 'string', example: 'pdf' },
            size: { type: 'number', example: 2048576 },
            path: { type: 'string', example: '/uploads/documents/factura-compresora-2025.pdf' },
            description: { type: 'string', nullable: true, example: 'Factura de compra' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Documento asociado al activo exitosamente.' },
              data: { type: 'object' },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    DocumentController.createDocument,
  );

  // Obtener documentos de un activo (Debe colocarse antes de /:id)
  fastify.get(
    '/asset/:assetId',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener lista de documentos vinculados a un activo fijo',
        tags: ['Gestión Documental'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['assetId'],
          properties: {
            assetId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['PHOTO', 'MANUAL', 'INVOICE', 'WARRANTY', 'REPORT', 'OTHER'],
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
    DocumentController.getAssetDocuments,
  );

  // Obtener detalle de documento por ID
  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Obtener detalle técnico de un documento por su ID',
        tags: ['Gestión Documental'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
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
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              message: { type: 'string', example: 'Documento no encontrado.' },
            },
          },
        },
      },
    },
    DocumentController.getDocumentById,
  );

  // Eliminar documento
  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Eliminar el registro de un documento asociado a un activo',
        tags: ['Gestión Documental'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Documento eliminado correctamente.' },
            },
          },
        },
      },
    },
    DocumentController.deleteDocument,
  );

  // Listar todos los documentos
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Listar todos los documentos adjuntos de activos fijos con búsqueda y paginación',
        tags: ['Gestión Documental'],
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', default: 1 },
            limit: { type: 'number', default: 20 },
            search: { type: 'string', description: 'Filtro por nombre de archivo o descripción' },
            type: {
              type: 'string',
              enum: ['PHOTO', 'MANUAL', 'INVOICE', 'WARRANTY', 'REPORT', 'OTHER'],
            },
            assetId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'array', items: { type: 'object' } },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    DocumentController.getAllDocuments,
  );
}
