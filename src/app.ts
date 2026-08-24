import Fastify, { FastifyInstance } from 'fastify';
import { errorHandler } from './interfaces/middlewares/error-handler';
import { healthRoutes } from './interfaces/routes/health.routes';
import { authRoutes } from './interfaces/routes/auth/auth.routes';
import { dashboardRoutes } from './interfaces/routes/dashboard.routes';
import { categoryRoutes } from './interfaces/routes/category.routes';
import { statusRoutes } from './interfaces/routes/status.routes';
import { locationRoutes } from './interfaces/routes/locations/location.routes';
import { projectRoutes } from './interfaces/routes/projects/project.routes';
import { assetRoutes } from './interfaces/routes/assets/asset.routes';
import { assetProjectRoutes } from './interfaces/routes/asset-project.routes';
import { assignmentRoutes } from './interfaces/routes/assignment.routes';
import { documentRoutes } from './interfaces/routes/document.routes';
import { maintenanceRoutes } from './interfaces/routes/maintenance.routes';
import { inventoryRoutes } from './interfaces/routes/inventory.routes';
import { importRoutes } from './interfaces/routes/import.routes';
import { reportRoutes } from './interfaces/routes/report.routes';
import { settingRoutes } from './interfaces/routes/setting.routes';
import { auditLogRoutes } from './interfaces/routes/audit-log.routes';
import { uploadRoutes } from './interfaces/routes/upload.routes';
import { userRoutes } from './interfaces/routes/users/user.routes';
import { registerSwagger } from './plugins/swagger.plugin';
import { registerCors } from './plugins/cors.plugin';
import { registerHelmet } from './plugins/helmet.plugin';
import { registerJwt } from './plugins/jwt.plugin';
import { registerMultipart } from './plugins/multipart.plugin';
import { registerAuditLogPlugin } from './plugins/audit-log.plugin';
import { registerStatic } from './plugins/static.plugin';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        strict: false,
      },
    },
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Plugins
  await registerHelmet(app);
  await registerCors(app);
  await registerSwagger(app);
  await registerJwt(app);
  await registerMultipart(app);
  await registerStatic(app);
  await app.register(registerAuditLogPlugin);

  // Health check a nivel raíz
  await app.register(healthRoutes);

  // Rutas con prefijo global /api/v1
  await app.register(
    async (apiV1) => {
      await apiV1.register(healthRoutes);
      await apiV1.register(authRoutes, { prefix: '/auth' });
      await apiV1.register(dashboardRoutes, { prefix: '/dashboard' });
      await apiV1.register(categoryRoutes, { prefix: '/categories' });
      await apiV1.register(statusRoutes, { prefix: '/statuses' });
      await apiV1.register(locationRoutes, { prefix: '/locations' });
      await apiV1.register(projectRoutes, { prefix: '/projects' });
      await apiV1.register(assetRoutes, { prefix: '/assets' });
      await apiV1.register(assetProjectRoutes, { prefix: '/asset-projects' });
      await apiV1.register(assignmentRoutes, { prefix: '/assignments' });
      await apiV1.register(documentRoutes, { prefix: '/documents' });
      await apiV1.register(maintenanceRoutes, { prefix: '/maintenances' });
      await apiV1.register(inventoryRoutes, { prefix: '/inventories' });
      await apiV1.register(importRoutes, { prefix: '/import' });
      await apiV1.register(reportRoutes, { prefix: '/reports' });
      await apiV1.register(settingRoutes, { prefix: '/settings' });
      await apiV1.register(auditLogRoutes, { prefix: '/audit-logs' });
      await apiV1.register(uploadRoutes, { prefix: '/uploads' });
      await apiV1.register(userRoutes, { prefix: '/users' });
    },
    { prefix: '/api/v1' },
  );

  return app;
}
