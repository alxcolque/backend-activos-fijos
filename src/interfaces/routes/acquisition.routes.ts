import { FastifyInstance } from 'fastify';
import { AcquisitionController } from '../controllers/acquisitions/acquisition.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function acquisitionRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/', AcquisitionController.getAcquisitions);
  fastify.get('/:id', AcquisitionController.getAcquisitionById);
  fastify.post('/', AcquisitionController.createAcquisition);
  fastify.put('/:id', AcquisitionController.updateAcquisition);
  fastify.patch('/:id', AcquisitionController.updateAcquisition);
  fastify.delete('/:id', AcquisitionController.deleteAcquisition);

  // Rutas de Detalles (Insumos/Activos)
  fastify.post('/:id/details', AcquisitionController.addDetail);
  fastify.delete('/details/:detailId', AcquisitionController.deleteDetail);
}
