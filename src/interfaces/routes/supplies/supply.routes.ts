import { FastifyInstance } from 'fastify';
import { SupplyController } from '../../controllers/supplies/supply.controller';
import { authenticate } from '../../middlewares/auth.middleware';

export async function supplyRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/',
    {
      onRequest: [authenticate],
    },
    SupplyController.getSupplies,
  );

  fastify.get(
    '/:id',
    {
      onRequest: [authenticate],
    },
    SupplyController.getSupplyById,
  );

  fastify.post(
    '/',
    {
      onRequest: [authenticate],
    },
    SupplyController.createSupply,
  );

  fastify.put(
    '/:id',
    {
      onRequest: [authenticate],
    },
    SupplyController.updateSupply,
  );

  fastify.delete(
    '/:id',
    {
      onRequest: [authenticate],
    },
    SupplyController.deleteSupply,
  );
}
