-- CreateTable for engines
CREATE TABLE IF NOT EXISTS `engines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `engines_identifier_key`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable critical_moments - Add new columns
ALTER TABLE `critical_moments` 
ADD COLUMN `bestLineDescription` TEXT NULL,
ADD COLUMN `bestLinePositionContext` TEXT NULL,
ADD COLUMN `bestLineTheme` VARCHAR(191) NULL,
ADD COLUMN `globalDescription` TEXT NULL,
MODIFY `description` TEXT NULL;

-- AlterTable games - Add AI analysis columns
ALTER TABLE `games`
ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN `aiAdvice` TEXT NULL,
ADD COLUMN `aiAnalysis` JSON NULL,
ADD COLUMN `aiAnalysisQueuedAt` DATETIME(3) NULL,
ADD COLUMN `aiKeyMoments` JSON NULL,
ADD COLUMN `aiSummary` TEXT NULL,
ADD COLUMN `needsAiAnalysis` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable users - Add conseilsIA column
ALTER TABLE `users`
ADD COLUMN `conseilsIA` TEXT NULL;
