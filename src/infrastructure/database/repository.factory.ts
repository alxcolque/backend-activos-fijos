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

// Repositorios Prisma (Desarrollo)
import { AuthRepository as PrismaAuthRepository } from '../repositories/auth.repository';
import { CategoryRepository as PrismaCategoryRepository } from '../repositories/category.repository';
import { StatusRepository as PrismaStatusRepository } from '../repositories/status.repository';
import { LocationRepository as PrismaLocationRepository } from '../repositories/location.repository';
import { ProjectRepository as PrismaProjectRepository } from '../repositories/project.repository';
import { AssetRepository as PrismaAssetRepository } from '../repositories/asset.repository';
import { AssetProjectRepository as PrismaAssetProjectRepository } from '../repositories/asset-project.repository';
import { AssignmentRepository as PrismaAssignmentRepository } from '../repositories/assignment.repository';
import { DocumentRepository as PrismaDocumentRepository } from '../repositories/document.repository';
import { MaintenanceRepository as PrismaMaintenanceRepository } from '../repositories/maintenance.repository';
import { SupplyRepository as PrismaSupplyRepository } from '../repositories/supply.repository';
import { SettingRepository as PrismaSettingRepository } from '../repositories/setting.repository';
import { ReportRepository as PrismaReportRepository } from '../repositories/report.repository';
import { ImportRepository as PrismaImportRepository } from '../repositories/import.repository';
import { DashboardRepository as PrismaDashboardRepository } from '../repositories/dashboard.repository';
import { AuditLogRepository as PrismaAuditLogRepository } from '../repositories/audit-log.repository';
import { UserRepository as PrismaUserRepository } from '../repositories/user.repository';

// Repositorios MySQL (Producción)
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

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  logger.info('📦 Factory: Utilizando repositorios MySQL (mysql2) para Producción');
} else {
  logger.info('📦 Factory: Utilizando repositorios Prisma para Desarrollo');
}

export class RepositoryFactory {
  public static getUserRepository(): IUserRepository {
    return isProduction ? new MySQLUserRepository() : new PrismaUserRepository();
  }
  public static getAuthRepository(): IAuthRepository {
    return isProduction ? new MySQLAuthRepository() : new PrismaAuthRepository();
  }

  public static getCategoryRepository(): ICategoryRepository {
    return isProduction ? new MySQLCategoryRepository() : new PrismaCategoryRepository();
  }

  public static getStatusRepository(): IStatusRepository {
    return isProduction ? new MySQLStatusRepository() : new PrismaStatusRepository();
  }

  public static getLocationRepository(): ILocationRepository {
    return isProduction ? new MySQLLocationRepository() : new PrismaLocationRepository();
  }

  public static getProjectRepository(): IProjectRepository {
    return isProduction ? new MySQLProjectRepository() : new PrismaProjectRepository();
  }

  public static getAssetRepository(): IAssetRepository {
    return isProduction ? new MySQLAssetRepository() : new PrismaAssetRepository();
  }

  public static getAssetProjectRepository(): IAssetProjectRepository {
    return isProduction ? new MySQLAssetProjectRepository() : new PrismaAssetProjectRepository();
  }

  public static getAssignmentRepository(): IAssignmentRepository {
    return isProduction ? new MySQLAssignmentRepository() : new PrismaAssignmentRepository();
  }

  public static getDocumentRepository(): IDocumentRepository {
    return isProduction ? new MySQLDocumentRepository() : new PrismaDocumentRepository();
  }

  public static getMaintenanceRepository(): IMaintenanceRepository {
    return isProduction ? new MySQLMaintenanceRepository() : new PrismaMaintenanceRepository();
  }

  public static getSupplyRepository(): ISupplyRepository {
    return isProduction ? new MySQLSupplyRepository() : new PrismaSupplyRepository();
  }

  public static getSettingRepository(): ISettingRepository {
    return isProduction ? new MySQLSettingRepository() : new PrismaSettingRepository();
  }

  public static getReportRepository(): IReportRepository {
    return isProduction ? new MySQLReportRepository() : new PrismaReportRepository();
  }

  public static getImportRepository(): IImportRepository {
    return isProduction ? new MySQLImportRepository() : new PrismaImportRepository();
  }

  public static getDashboardRepository(): IDashboardRepository {
    return isProduction ? new MySQLDashboardRepository() : new PrismaDashboardRepository();
  }

  public static getAuditLogRepository(): IAuditLogRepository {
    return isProduction ? new MySQLAuditLogRepository() : new PrismaAuditLogRepository();
  }
}
