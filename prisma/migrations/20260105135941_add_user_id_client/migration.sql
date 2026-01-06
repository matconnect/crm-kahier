-- AlterTable
ALTER TABLE `ClientInteraction` ADD COLUMN `userId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ClientInteraction_userId_idx` ON `ClientInteraction`(`userId`);

-- AddForeignKey
ALTER TABLE `ClientInteraction` ADD CONSTRAINT `ClientInteraction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
