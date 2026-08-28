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
import { supplyRoutes } from './interfaces/routes/supplies/supply.routes';
import { supplyProjectRoutes } from './interfaces/routes/supply-project.routes';
import { acquisitionRoutes } from './interfaces/routes/acquisition.routes';
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
    logger: false,
    disableRequestLogging: true,
    ajv: {
      customOptions: {
        keywords: ['example'],
      },
    },
  });

  // Plugins globales
  await registerCors(app);
  await registerHelmet(app);
  await registerJwt(app);
  await registerMultipart(app);
  await registerSwagger(app);
  await registerStatic(app);
  await registerAuditLogPlugin(app);

  // Manejo global de errores
  app.setErrorHandler(errorHandler);

  // Registro de rutas API
  const registerApiRoutes = async (apiInstance: any) => {
    await apiInstance.register(healthRoutes, { prefix: '/health' });
    await apiInstance.register(authRoutes, { prefix: '/auth' });
    await apiInstance.register(dashboardRoutes, { prefix: '/dashboard' });
    await apiInstance.register(categoryRoutes, { prefix: '/categories' });
    await apiInstance.register(statusRoutes, { prefix: '/statuses' });
    await apiInstance.register(locationRoutes, { prefix: '/locations' });
    await apiInstance.register(projectRoutes, { prefix: '/projects' });
    await apiInstance.register(assetRoutes, { prefix: '/assets' });
    await apiInstance.register(assetProjectRoutes, { prefix: '/asset-projects' });
    await apiInstance.register(assignmentRoutes, { prefix: '/assignments' });
    await apiInstance.register(documentRoutes, { prefix: '/documents' });
    await apiInstance.register(maintenanceRoutes, { prefix: '/maintenances' });
    await apiInstance.register(supplyRoutes, { prefix: '/supplies' });
    await apiInstance.register(supplyProjectRoutes, { prefix: '/supply-projects' });
    await apiInstance.register(acquisitionRoutes, { prefix: '/acquisitions' });
    await apiInstance.register(importRoutes, { prefix: '/import' });
    await apiInstance.register(reportRoutes, { prefix: '/reports' });
    await apiInstance.register(settingRoutes, { prefix: '/settings' });
    await apiInstance.register(auditLogRoutes, { prefix: '/audit-logs' });
    await apiInstance.register(uploadRoutes, { prefix: '/uploads' });
    await apiInstance.register(userRoutes, { prefix: '/users' });
  };

  // 1. Ruta estándar única /api (Recomendado en Producción)
  app.register(registerApiRoutes, { prefix: '/api' });

  // 2. Compatibilidad retroactiva directa para rutas raíz
  app.register(registerApiRoutes);

  return app;
}
