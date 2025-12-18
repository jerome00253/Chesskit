-- AlterTable
ALTER TABLE `games` ADD COLUMN `boardHue` INTEGER NULL,
    ADD COLUMN `engineMultiPv` INTEGER NULL,
    ADD COLUMN `pieceSet` VARCHAR(191) NULL,
    ADD COLUMN `showBestMove` BOOLEAN NULL,
    ADD COLUMN `showPlayerMove` BOOLEAN NULL;
