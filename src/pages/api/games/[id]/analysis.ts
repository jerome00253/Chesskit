import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import {
  getGameClassification,
  TimeSettings,
  DEFAULT_TIME_SETTINGS,
} from "@/lib/gameClassification";
import { z } from "zod";

const analysisSchema = z.object({
  eval: z.any().optional(),
  movesCount: z.number().optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { id } = req.query;
  const gameId = parseInt(id as string, 10);

  if (isNaN(gameId)) {
    return res.status(400).json({ message: "Invalid game ID" });
  }

  // Verify user owns the game
  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      userId: session.user.id,
    },
    select: {
      id: true,
      timeControl: true,
    },
  });

  if (!game) {
    return res.status(404).json({ message: "Game not found" });
  }

  if (req.method === "POST") {
    try {
      const data = analysisSchema.parse(req.body);

      // Get user's time settings
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { timeSettings: true },
      });

      const timeSettings =
        (user?.timeSettings as unknown as TimeSettings) ||
        DEFAULT_TIME_SETTINGS;

      // Classify the game based on time control
      const classification = getGameClassification(
        game.timeControl,
        timeSettings
      );

      // Update game with analysis and classification
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          eval: data.eval,
          gameType: classification.gameType,
          initialTime: classification.initialTime,
          increment: classification.increment,
          movesCount: data.movesCount,
        },
      });

      return res.status(200).json({
        message: "Analysis saved successfully",
        gameType: classification.gameType,
        game: updatedGame,
      });
    } catch (error) {
      console.error("Failed to save analysis:", error);
      return res.status(500).json({ message: "Error saving analysis" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
