/*
  Warnings:

  - You are about to alter the column `date` on the `games` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.

*/
-- AlterTable
ALTER TABLE `games` ADD COLUMN `blackExcellent` INTEGER NULL,
    ADD COLUMN `blackInaccuracy` INTEGER NULL,
    ADD COLUMN `blackOkay` INTEGER NULL,
    ADD COLUMN `blackOpening` INTEGER NULL,
    ADD COLUMN `blackPerfect` INTEGER NULL,
    ADD COLUMN `blackSplendid` INTEGER NULL,
    ADD COLUMN `ecoUrl` VARCHAR(191) NULL,
    ADD COLUMN `gameUrl` VARCHAR(191) NULL,
    ADD COLUMN `importOrigin` VARCHAR(191) NULL,
    ADD COLUMN `whiteExcellent` INTEGER NULL,
    ADD COLUMN `whiteInaccuracy` INTEGER NULL,
    ADD COLUMN `whiteOkay` INTEGER NULL,
    ADD COLUMN `whiteOpening` INTEGER NULL,
    ADD COLUMN `whitePerfect` INTEGER NULL,
    ADD COLUMN `whiteSplendid` INTEGER NULL,
    MODIFY `date` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `autoImportEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `autoImportInterval` INTEGER NOT NULL DEFAULT 21600,
    ADD COLUMN `autoImportPlatforms` JSON NULL,
    ADD COLUMN `lastAutoImport` DATETIME(3) NULL,
    ADD COLUMN `preferredLocale` VARCHAR(191) NOT NULL DEFAULT 'en',
    ADD COLUMN `rating` INTEGER NOT NULL DEFAULT 1200,
    ADD COLUMN `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';
