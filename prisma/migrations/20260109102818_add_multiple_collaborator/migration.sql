/*
  Warnings:

  - You are about to drop the column `collaboratorId` on the `ClientInteraction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `ClientInteraction` DROP FOREIGN KEY `ClientInteraction_collaboratorId_fkey`;

-- DropIndex
DROP INDEX `ClientInteraction_collaboratorId_idx` ON `ClientInteraction`;

-- AlterTable
ALTER TABLE `ClientInteraction` DROP COLUMN `collaboratorId`;

-- CreateTable
CREATE TABLE `_InteractionCollaborators` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_InteractionCollaborators_AB_unique`(`A`, `B`),
    INDEX `_InteractionCollaborators_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_InteractionCollaborators` ADD CONSTRAINT `_InteractionCollaborators_A_fkey` FOREIGN KEY (`A`) REFERENCES `ClientInteraction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_InteractionCollaborators` ADD CONSTRAINT `_InteractionCollaborators_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
