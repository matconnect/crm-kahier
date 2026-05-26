-- Add subscription type on company for billing visibility
ALTER TABLE `Company`
  ADD COLUMN `subscriptionType` VARCHAR(191) NOT NULL DEFAULT 'STARTER_FREE';
