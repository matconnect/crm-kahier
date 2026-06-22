-- AlterTable
ALTER TABLE `Company`
    ADD COLUMN `legalForm` VARCHAR(191) NULL,
    ADD COLUMN `capitalSocialCents` INTEGER NULL,
    ADD COLUMN `siren` VARCHAR(191) NULL,
    ADD COLUMN `siret` VARCHAR(191) NULL,
    ADD COLUMN `vatNumber` VARCHAR(191) NULL,
    ADD COLUMN `rcsCity` VARCHAR(191) NULL,
    ADD COLUMN `addressLine1` VARCHAR(191) NULL,
    ADD COLUMN `addressLine2` VARCHAR(191) NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `contactEmail` VARCHAR(191) NULL,
    ADD COLUMN `contactPhone` VARCHAR(191) NULL,
    ADD COLUMN `paymentTerms` VARCHAR(191) NULL,
    ADD COLUMN `latePenaltyRateBps` INTEGER NULL,
    ADD COLUMN `fixedCompensationCents` INTEGER NOT NULL DEFAULT 4000;

-- AlterTable
ALTER TABLE `Client`
    ADD COLUMN `addressLine1` VARCHAR(191) NULL,
    ADD COLUMN `addressLine2` VARCHAR(191) NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `siren` VARCHAR(191) NULL,
    ADD COLUMN `vatNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Invoice`
    ADD COLUMN `serviceDate` DATETIME(3) NULL,
    ADD COLUMN `purchaseOrderNumber` VARCHAR(191) NULL,
    ADD COLUMN `operationType` ENUM('SALE', 'SERVICE', 'MIXED') NULL,
    ADD COLUMN `deliveryAddress` TEXT NULL,
    ADD COLUMN `issuerSnapshot` JSON NULL,
    ADD COLUMN `clientSnapshot` JSON NULL;

-- AlterTable
ALTER TABLE `Quote`
    ADD COLUMN `executionLocation` VARCHAR(191) NULL,
    ADD COLUMN `isFree` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `quoteCostCents` INTEGER NULL,
    ADD COLUMN `issuerSnapshot` JSON NULL,
    ADD COLUMN `clientSnapshot` JSON NULL;
