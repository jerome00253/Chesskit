-- AlterTable
ALTER TABLE `games` ADD COLUMN `gameType` VARCHAR(191) NULL,
    ADD COLUMN `increment` INTEGER NULL,
    ADD COLUMN `initialTime` INTEGER NULL,
    ADD COLUMN `movesCount` INTEGER NULL;
