-- AlterTable
ALTER TABLE `critical_moments` ADD COLUMN `bestLines` JSON NULL,
    ADD COLUMN `commentaryEn` TEXT NULL,
    ADD COLUMN `commentaryFr` TEXT NULL,
    ADD COLUMN `isUserMove` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `multiPvLines` INTEGER NULL,
    ADD COLUMN `playerColor` VARCHAR(191) NULL,
    ADD COLUMN `positionContext` TEXT NULL,
    ADD COLUMN `tactical` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `themes` JSON NULL;
