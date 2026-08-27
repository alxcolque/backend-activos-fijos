/**
 * repository.factory.prod.ts
 * Fábrica de repositorios EXCLUSIVA para producción (mysql2 nativo).
 * Este archivo reemplaza a repository.factory.ts durante el build de producción.
 * NO importa nada de @prisma/client.
 */
import { IAuthRepository } from '../../domain/auth/auth.repository.interface';
import { ICategoryRepository } from '../../domain/category/category.repository.interface';
import { IStatusRepository } from '../../domain/status/status.repository.interface';
import { ILocationRepository } from '../../domain/locations/location.repository.interface';
import { IProjectRepository } from '../../domain/projects/project.repository.interface';
import { IAssetRepository } from '../../domain/assets/asset.repository.interface';
import { IAssetProjectRepository } from '../../domain/asset-projects/asset-project.repository.interface';
import { IAssignmentRepository } from '../../domain/assignments/assignment.repository.interface';
import { IDocumentRepository } from '../../domain/documents/document.repository.interface';
import { IMaintenanceRepository } from '../../domain/maintenances/maintenance.repository.interface';
import { ISupplyRepository } from '../../domain/supplies/supply.repository.interface';
import { ISettingRepository } from '../../domain/settings/setting.repository.interface';
import { IReportRepository } from '../../domain/reports/report.repository.interface';
import { IImportRepository } from '../../domain/import/import.repository.interface';
import { IDashboardRepository } from '../../domain/dashboard/dashboard.repository.interface';
import { IAuditLogRepository } from '../../domain/audit-logs/audit-log.repository.interface';
import { IUserRepository } from '../../domain/users/user.repository.interface';

// Repositorios MySQL nativos (mysql2) — sin Prisma
import { MySQLAuthRepository } from './mysql/repositories/mysql-auth.repository';
import { MySQLCategoryRepository } from './mysql/repositories/mysql-category.repository';
import { MySQLStatusRepository } from './mysql/repositories/mysql-status.repository';
import { MySQLLocationRepository } from './mysql/repositories/mysql-location.repository';
import { MySQLProjectRepository } from './mysql/repositories/mysql-project.repository';
import { MySQLAssetRepository } from './mysql/repositories/mysql-asset.repository';
import { MySQLAssetProjectRepository } from './mysql/repositories/mysql-asset-project.repository';
import { MySQLAssignmentRepository } from './mysql/repositories/mysql-assignment.repository';
import { MySQLDocumentRepository } from './mysql/repositories/mysql-document.repository';
import { MySQLMaintenanceRepository } from './mysql/repositories/mysql-maintenance.repository';
import { MySQLSupplyRepository } from './mysql/repositories/mysql-supply.repository';
import { MySQLSettingRepository } from './mysql/repositories/mysql-setting.repository';
import { MySQLReportRepository } from './mysql/repositories/mysql-report.repository';
import { MySQLImportRepository } from './mysql/repositories/mysql-import.repository';
import { MySQLDashboardRepository } from './mysql/repositories/mysql-dashboard.repository';
import { MySQLAuditLogRepository } from './mysql/repositories/mysql-audit-log.repository';
import { MySQLUserRepository } from './mysql/repositories/mysql-user.repository';

import { logger } from '../logger/logger';

logger.info('📦 Factory (PROD): Utilizando repositorios MySQL (mysql2) para Producción');

export class RepositoryFactory {
  public static getUserRepository(): IUserRepository {
    return new MySQLUserRepository();
  }
  public static getAuthRepository(): IAuthRepository {
    return new MySQLAuthRepository();
  }

  public static getCategoryRepository(): ICategoryRepository {
    return new MySQLCategoryRepository();
  }

  public static getStatusRepository(): IStatusRepository {
    return new MySQLStatusRepository();
  }

  public static getLocationRepository(): ILocationRepository {
    return new MySQLLocationRepository();
  }

  public static getProjectRepository(): IProjectRepository {
    return new MySQLProjectRepository();
  }

  public static getAssetRepository(): IAssetRepository {
    return new MySQLAssetRepository();
  }

  public static getAssetProjectRepository(): IAssetProjectRepository {
    return new MySQLAssetProjectRepository();
  }

  public static getAssignmentRepository(): IAssignmentRepository {
    return new MySQLAssignmentRepository();
  }

  public static getDocumentRepository(): IDocumentRepository {
    return new MySQLDocumentRepository();
  }

  public static getMaintenanceRepository(): IMaintenanceRepository {
    return new MySQLMaintenanceRepository();
  }

  public static getSupplyRepository(): ISupplyRepository {
    return new MySQLSupplyRepository();
  }

  public static getSettingRepository(): ISettingRepository {
    return new MySQLSettingRepository();
  }

  public static getReportRepository(): IReportRepository {
    return new MySQLReportRepository();
  }

  public static getImportRepository(): IImportRepository {
    return new MySQLImportRepository();
  }

  public static getDashboardRepository(): IDashboardRepository {
    return new MySQLDashboardRepository();
  }

  public static getAuditLogRepository(): IAuditLogRepository {
    return new MySQLAuditLogRepository();
  }
}
