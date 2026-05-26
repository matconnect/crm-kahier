-- AlterTable
ALTER TABLE `Client` ADD COLUMN `revenueSource` ENUM('REFERRAL', 'OUTBOUND', 'ADS', 'PARTNER', 'UPSELL', 'OTHER') NULL;

-- CreateTable
CREATE TABLE `KahierConnection` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `kahierEstablishmentId` INTEGER NOT NULL,
    `kahierEstablishmentName` VARCHAR(191) NOT NULL,
    `kahierZoneId` INTEGER NULL,
    `kahierZoneName` VARCHAR(191) NULL,
    `kahierUserId` INTEGER NULL,
    `kahierUserLabel` VARCHAR(191) NULL,
    `linkedByUserId` VARCHAR(191) NULL,
    `linkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KahierConnection_companyId_key`(`companyId`),
    INDEX `KahierConnection_kahierEstablishmentId_idx`(`kahierEstablishmentId`),
    INDEX `KahierConnection_kahierZoneId_idx`(`kahierZoneId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KahierLinkToken` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `codePreview` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `kahierEstablishmentId` INTEGER NULL,
    `kahierEstablishmentName` VARCHAR(191) NULL,
    `kahierZoneId` INTEGER NULL,
    `kahierZoneName` VARCHAR(191) NULL,
    `kahierUserId` INTEGER NULL,
    `kahierUserLabel` VARCHAR(191) NULL,

    UNIQUE INDEX `KahierLinkToken_codeHash_key`(`codeHash`),
    INDEX `KahierLinkToken_companyId_expiresAt_idx`(`companyId`, `expiresAt`),
    INDEX `KahierLinkToken_companyId_consumedAt_idx`(`companyId`, `consumedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `context` TEXT NULL,
    `goals` TEXT NULL,
    `deliverables` TEXT NULL,
    `successMetrics` TEXT NULL,
    `risks` TEXT NULL,
    `notes` TEXT NULL,
    `status` ENUM('DRAFT', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `budgetAmount` INTEGER NULL,
    `revenueAmount` INTEGER NULL,
    `costAmount` INTEGER NULL,
    `invoicedAmount` INTEGER NULL,
    `receivedAmount` INTEGER NULL,
    `billingMode` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NULL,
    `ownerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Project_companyId_idx`(`companyId`),
    INDEX `Project_clientId_idx`(`clientId`),
    INDEX `Project_ownerId_idx`(`ownerId`),
    INDEX `Project_status_idx`(`status`),
    INDEX `Project_priority_idx`(`priority`),
    INDEX `Project_name_idx`(`name`),
    INDEX `Project_endDate_idx`(`endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `KahierConnection` ADD CONSTRAINT `KahierConnection_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KahierLinkToken` ADD CONSTRAINT `KahierLinkToken_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

