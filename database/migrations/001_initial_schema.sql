-- ==============================================================================
-- SCHEMA DDL INITIAL FOR MYSQL (cPanel / Production) - SISTEMA ACTIVOS FIJOS
-- Database: culkingc_comibol / MySQL 3306
-- ==============================================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `fullName` VARCHAR(255) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `lastLogin` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asset_categories` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `usefulLife` INT NOT NULL DEFAULT 5,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_categories_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asset_statuses` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_statuses_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `locations` (
  `id` VARCHAR(36) NOT NULL,
  `parentId` VARCHAR(36) NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  KEY `locations_parentId_idx` (`parentId`),
  KEY `locations_name_idx` (`name`),
  CONSTRAINT `fk_locations_parent` FOREIGN KEY (`parentId`) REFERENCES `locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `address` TEXT NULL,
  `responsible` VARCHAR(255) NULL,
  `status` ENUM('ACTIVE', 'FINISHED', 'SUSPENDED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `startDate` DATETIME(3) NULL,
  `endDate` DATETIME(3) NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projects_name_unique` (`name`),
  KEY `projects_name_idx` (`name`),
  KEY `projects_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `assets` (
  `id` VARCHAR(36) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `qrCode` VARCHAR(191) NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `categoryId` VARCHAR(36) NOT NULL,
  `statusId` VARCHAR(36) NOT NULL,
  `locationId` VARCHAR(36) NOT NULL,
  `brand` VARCHAR(255) NULL,
  `model` VARCHAR(255) NULL,
  `serialNumber` VARCHAR(191) NULL,
  `unit` VARCHAR(50) NULL DEFAULT 'PZA',
  `quantity` INT NOT NULL DEFAULT 1,
  `quantity_out` INT NOT NULL DEFAULT 0,
  `purchaseDate` DATETIME(3) NULL,
  `purchaseYear` INT NULL,
  `purchaseValue` DECIMAL(12,2) NULL,
  `residualValue` DECIMAL(12,2) NULL,
  `currentValue` DECIMAL(12,2) NULL,
  `observations` TEXT NULL,
  `photo` VARCHAR(500) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deletedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assets_code_unique` (`code`),
  UNIQUE KEY `assets_qrCode_unique` (`qrCode`),
  UNIQUE KEY `assets_serialNumber_unique` (`serialNumber`),
  KEY `assets_code_idx` (`code`),
  KEY `assets_qrCode_idx` (`qrCode`),
  KEY `assets_serialNumber_idx` (`serialNumber`),
  KEY `assets_categoryId_idx` (`categoryId`),
  KEY `assets_statusId_idx` (`statusId`),
  KEY `assets_locationId_idx` (`locationId`),
  KEY `assets_purchaseDate_idx` (`purchaseDate`),
  CONSTRAINT `fk_assets_category` FOREIGN KEY (`categoryId`) REFERENCES `asset_categories` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_assets_status` FOREIGN KEY (`statusId`) REFERENCES `asset_statuses` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_assets_location` FOREIGN KEY (`locationId`) REFERENCES `locations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asset_projects` (
  `id` VARCHAR(36) NOT NULL,
  `assetId` VARCHAR(36) NOT NULL,
  `projectId` VARCHAR(36) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `releasedAt` DATETIME(3) NULL,
  `observations` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_projects_assetId_idx` (`assetId`),
  KEY `asset_projects_projectId_idx` (`projectId`),
  CONSTRAINT `fk_ap_asset` FOREIGN KEY (`assetId`) REFERENCES `assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ap_project` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asset_assignments` (
  `id` VARCHAR(36) NOT NULL,
  `assetId` VARCHAR(36) NOT NULL,
  `responsibleName` VARCHAR(255) NOT NULL,
  `position` VARCHAR(255) NULL,
  `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `returnedAt` DATETIME(3) NULL,
  `observations` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `asset_assignments_assetId_idx` (`assetId`),
  CONSTRAINT `fk_aa_asset` FOREIGN KEY (`assetId`) REFERENCES `assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asset_documents` (
  `id` VARCHAR(36) NOT NULL,
  `assetId` VARCHAR(36) NOT NULL,
  `type` ENUM('PHOTO', 'MANUAL', 'INVOICE', 'WARRANTY', 'REPORT', 'OTHER') NOT NULL DEFAULT 'OTHER',
  `fileName` VARCHAR(255) NOT NULL,
  `originalName` VARCHAR(255) NOT NULL,
  `mimeType` VARCHAR(100) NOT NULL,
  `extension` VARCHAR(20) NOT NULL,
  `size` INT NOT NULL,
  `path` VARCHAR(500) NOT NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `asset_documents_assetId_idx` (`assetId`),
  CONSTRAINT `fk_ad_asset` FOREIGN KEY (`assetId`) REFERENCES `assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asset_maintenances` (
  `id` VARCHAR(36) NOT NULL,
  `assetId` VARCHAR(36) NOT NULL,
  `type` ENUM('PREVENTIVE', 'CORRECTIVE') NOT NULL DEFAULT 'PREVENTIVE',
  `maintenanceDate` DATETIME(3) NOT NULL,
  `provider` VARCHAR(255) NULL,
  `cost` DECIMAL(12,2) NULL,
  `nextMaintenance` DATETIME(3) NULL,
  `observations` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `asset_maintenances_assetId_idx` (`assetId`),
  CONSTRAINT `fk_am_asset` FOREIGN KEY (`assetId`) REFERENCES `assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventories` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `inventoryDate` DATETIME(3) NOT NULL,
  `locationId` VARCHAR(36) NOT NULL,
  `observations` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_inventories_location` FOREIGN KEY (`locationId`) REFERENCES `locations` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_items` (
  `id` VARCHAR(36) NOT NULL,
  `inventoryId` VARCHAR(36) NOT NULL,
  `assetId` VARCHAR(36) NOT NULL,
  `status` ENUM('FOUND', 'NOT_FOUND', 'DAMAGED') NOT NULL DEFAULT 'FOUND',
  `observations` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `inventory_items_inventoryId_idx` (`inventoryId`),
  KEY `inventory_items_assetId_idx` (`assetId`),
  CONSTRAINT `fk_ii_inventory` FOREIGN KEY (`inventoryId`) REFERENCES `inventories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ii_asset` FOREIGN KEY (`assetId`) REFERENCES `assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` VARCHAR(36) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `value` TEXT NOT NULL,
  `description` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
