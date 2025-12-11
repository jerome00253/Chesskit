import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import {
  getGameClassification,
  TimeSettings,
  DEFAULT_TIME_SETTINGS,
} from "@/lib/gameClassification";
import { calculateGameLevel } from "@/lib/gameLevel";
import { z } from "zod";

// Schema for move evaluation
const moveEvaluationSchema = z.object({
  ply: z.number(),
  eval: z.number().nullable(),
  bestMove: z.string().optional(),
  classification: z.string().optional(), // "book", "best", "good", "inaccuracy", "mistake", "blunder", "brilliant"
  evalDiff: z.number().nullable(),
});

// Schema for critical moment
const criticalMomentSchema = z.object({
  ply: z.number(),
  fen: z.string(),
  move: z.string(),
  bestMove: z.string().optional(),
  type: z.enum(["blunder", "mistake", "excellent", "best"]),
  evalBefore: z.number().optional(),
  evalAfter: z.number().optional(),
  evalDiff: z.number().optional(),
  description: z.string().optional(),
});

// Main analysis schema
const analysisSchema = z.object({
  // Engine info
  engineName: z.string().optional(),
  engineDepth: z.number().optional(),

  // Accuracy statistics
  whiteAccuracy: z.number().optional(),
  blackAccuracy: z.number().optional(),
  whiteBrilliant: z.number().optional(),
  whiteBest: z.number().optional(),
  whiteMistakes: z.number().optional(),
  whiteBlunders: z.number().optional(),
  blackBrilliant: z.number().optional(),
  blackBest: z.number().optional(),
  blackMistakes: z.number().optional(),
  blackBlunders: z.number().optional(),

  // Opening
  openingECO: z.string().optional(),
  openingName: z.string().optional(),

  // Move evaluations array
  moveEvaluations: z.array(moveEvaluationSchema).optional(),

  // Critical moments
  criticalMoments: z.array(criticalMomentSchema).optional(),

  // Legacy support
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

  // GET: Load existing analysis
  if (req.method === "GET") {
    try {
      const game = await prisma.game.findFirst({
        where: {
          id: gameId,
          userId: session.user.id,
        },
        include: {
          criticalMoments: {
            orderBy: { ply: "asc" },
          },
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      return res.status(200).json({
        analyzed: game.analyzed,
        analyzedAt: game.analyzedAt,
        engineName: game.engineName,
        engineDepth: game.engineDepth,
        whiteAccuracy: game.whiteAccuracy,
        blackAccuracy: game.blackAccuracy,
        whiteBrilliant: game.whiteBrilliant,
        whiteBest: game.whiteBest,
        whiteMistakes: game.whiteMistakes,
        whiteBlunders: game.whiteBlunders,
        blackBrilliant: game.blackBrilliant,
        blackBest: game.blackBest,
        blackMistakes: game.blackMistakes,
        blackBlunders: game.blackBlunders,
        openingECO: game.openingECO,
        openingName: game.openingName,
        gameLevel: game.gameLevel,
        gameType: game.gameType,
        moveEvaluations: game.moveEvaluations,
        criticalMoments: game.criticalMoments,
        eval: game.eval,
      });
    } catch (error) {
      console.error("Failed to load analysis:", error);
      return res.status(500).json({ message: "Error loading analysis" });
    }
  }

  // POST: Save analysis
  if (req.method === "POST") {
    try {
      const data = analysisSchema.parse(req.body);

      // Get game with ratings for level calculation
      const game = await prisma.game.findFirst({
        where: {
          id: gameId,
          userId: session.user.id,
        },
        select: {
          id: true,
          timeControl: true,
          whiteRating: true,
          blackRating: true,
        },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

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

      // Calculate game level from Elo
      const gameLevel = calculateGameLevel(game.whiteRating, game.blackRating);

      // Update game with analysis data
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          // Mark as analyzed
          analyzed: true,
          analyzedAt: new Date(),
          engineName: data.engineName,
          engineDepth: data.engineDepth,

          // Classification
          gameType: classification.gameType,
          initialTime: classification.initialTime,
          increment: classification.increment,
          movesCount: data.movesCount,
          gameLevel: gameLevel,

          // Accuracy stats
          whiteAccuracy: data.whiteAccuracy,
          blackAccuracy: data.blackAccuracy,
          whiteBrilliant: data.whiteBrilliant,
          whiteBest: data.whiteBest,
          whiteMistakes: data.whiteMistakes,
          whiteBlunders: data.whiteBlunders,
          blackBrilliant: data.blackBrilliant,
          blackBest: data.blackBest,
          blackMistakes: data.blackMistakes,
          blackBlunders: data.blackBlunders,

          // Opening
          openingECO: data.openingECO,
          openingName: data.openingName,

          // Move evaluations (JSON)
          moveEvaluations: data.moveEvaluations,

          // Legacy eval support
          eval: data.eval,
        },
      });

      // Save critical moments
      if (data.criticalMoments && data.criticalMoments.length > 0) {
        // Delete existing critical moments for this game
        await prisma.criticalMoment.deleteMany({
          where: { gameId: gameId },
        });

        // Create new critical moments
        await prisma.criticalMoment.createMany({
          data: data.criticalMoments.map((moment) => ({
            gameId: gameId,
            userId: session.user.id,
            ply: moment.ply,
            fen: moment.fen,
            move: moment.move,
            bestMove: moment.bestMove,
            type: moment.type,
            evalBefore: moment.evalBefore,
            evalAfter: moment.evalAfter,
            evalDiff: moment.evalDiff,
            description: moment.description,
          })),
        });
      }

      return res.status(200).json({
        message: "Analysis saved successfully",
        gameType: classification.gameType,
        gameLevel: gameLevel,
        analyzed: true,
        game: updatedGame,
      });
    } catch (error) {
      console.error("Failed to save analysis:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ message: "Error saving analysis", error: errorMessage });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
