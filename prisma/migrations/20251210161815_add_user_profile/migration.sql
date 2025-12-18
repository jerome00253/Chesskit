-- AlterTable
ALTER TABLE `games` ADD COLUMN `userColor` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `chesscomUsername` VARCHAR(191) NULL,
    ADD COLUMN `firstName` VARCHAR(191) NULL,
    ADD COLUMN `lastName` VARCHAR(191) NULL,
    ADD COLUMN `lichessUsername` VARCHAR(191) NULL,
    ADD COLUMN `timeSettings` JSON NULL;
