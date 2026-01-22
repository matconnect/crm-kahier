-- AlterTable
ALTER TABLE `Client` ADD COLUMN `emails` JSON NULL,
    ADD COLUMN `phones` JSON NULL;

-- AlterTable
ALTER TABLE `ClientContact` ADD COLUMN `emails` JSON NULL,
    ADD COLUMN `phones` JSON NULL;
