-- AlterTable
ALTER TABLE `games` ADD COLUMN `analyzed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `analyzedAt` DATETIME(3) NULL,
    ADD COLUMN `blackAccuracy` DOUBLE NULL,
    ADD COLUMN `blackBest` INTEGER NULL,
    ADD COLUMN `blackBlunders` INTEGER NULL,
    ADD COLUMN `blackBrilliant` INTEGER NULL,
    ADD COLUMN `blackMistakes` INTEGER NULL,
    ADD COLUMN `engineDepth` INTEGER NULL,
    ADD COLUMN `engineName` VARCHAR(191) NULL,
    ADD COLUMN `gameLevel` VARCHAR(191) NULL,
    ADD COLUMN `moveEvaluations` JSON NULL,
    ADD COLUMN `openingECO` VARCHAR(191) NULL,
    ADD COLUMN `openingName` VARCHAR(191) NULL,
    ADD COLUMN `whiteAccuracy` DOUBLE NULL,
    ADD COLUMN `whiteBest` INTEGER NULL,
    ADD COLUMN `whiteBlunders` INTEGER NULL,
    ADD COLUMN `whiteBrilliant` INTEGER NULL,
    ADD COLUMN `whiteMistakes` INTEGER NULL;

-- CreateTable
CREATE TABLE `critical_moments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gameId` INTEGER NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ply` INTEGER NOT NULL,
    `fen` TEXT NOT NULL,
    `move` VARCHAR(191) NOT NULL,
    `bestMove` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `evalBefore` DOUBLE NULL,
    `evalAfter` DOUBLE NULL,
    `evalDiff` DOUBLE NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `critical_moments_userId_idx`(`userId`),
    INDEX `critical_moments_gameId_idx`(`gameId`),
    INDEX `critical_moments_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `games_analyzed_idx` ON `games`(`analyzed`);

-- AddForeignKey
ALTER TABLE `critical_moments` ADD CONSTRAINT `critical_moments_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `critical_moments` ADD CONSTRAINT `critical_moments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
