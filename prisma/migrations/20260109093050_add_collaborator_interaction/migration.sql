-- AlterTable
ALTER TABLE `ClientInteraction` ADD COLUMN `collaboratorId` VARCHAR(191) NULL,
    ADD COLUMN `meetingEnd` DATETIME(3) NULL,
    ADD COLUMN `meetingStart` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `ClientInteraction_collaboratorId_idx` ON `ClientInteraction`(`collaboratorId`);

-- AddForeignKey
ALTER TABLE `ClientInteraction` ADD CONSTRAINT `ClientInteraction_collaboratorId_fkey` FOREIGN KEY (`collaboratorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
