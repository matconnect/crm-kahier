ALTER TABLE `Company`
  ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL,
  ADD COLUMN `stripeSubscriptionId` VARCHAR(191) NULL,
  ADD COLUMN `stripePriceId` VARCHAR(191) NULL,
  ADD COLUMN `stripeSubscriptionStatus` VARCHAR(191) NULL,
  ADD COLUMN `stripePurchasedAt` DATETIME(3) NULL,
  ADD COLUMN `stripeCurrentPeriodStart` DATETIME(3) NULL,
  ADD COLUMN `stripeCurrentPeriodEnd` DATETIME(3) NULL;

CREATE UNIQUE INDEX `Company_stripeCustomerId_key` ON `Company`(`stripeCustomerId`);
CREATE UNIQUE INDEX `Company_stripeSubscriptionId_key` ON `Company`(`stripeSubscriptionId`);
