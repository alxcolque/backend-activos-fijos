import { FastifyInstance } from 'fastify';
import { SupplyProjectController } from '../controllers/supply-projects/supply-project.controller';
import { authenticate } from '../middlewares/auth.middleware';

export async function supplyProjectRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authenticate);

  fastify.get('/project/:projectId', SupplyProjectController.getByProjectId);
  fastify.post('/', SupplyProjectController.assign);
  fastify.put('/:id/release', SupplyProjectController.release);
  fastify.delete('/:id', SupplyProjectController.delete);
}
