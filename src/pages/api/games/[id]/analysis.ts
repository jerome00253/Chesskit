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
  fen: z.string().optional(),
  move: z.string().optional(),
  bestMove: z.string().optional(),
  type: z.string(), // Expanded to allow "info" and other types
  evalBefore: z.number().optional().nullable(),
  evalAfter: z.number().optional().nullable(),
  evalDiff: z.number().optional().nullable(),
  description: z.string().optional(), // i18n key JSON
  
  // New fields
  commentaryEn: z.string().optional(),
  commentaryFr: z.string().optional(),
  playerColor: z.string().optional(),
  isUserMove: z.boolean().optional(),
  bestLines: z.any().optional(), // Json
  multiPvLines: z.number().optional(),
  positionContext: z.string().optional(),
  tactical: z.boolean().optional(),
  themes: z.any().optional(), // Json
  
  // Best line analysis
  bestLineDescription: z.string().optional(), // i18n key JSON
  bestLineTheme: z.any().optional(), // Json
  bestLinePositionContext: z.string().optional(),
  globalDescription: z.string().optional(), // i18n key JSON
});

// Main analysis schema
const analysisSchema = z.object({
  // Engine info
  engineName: z.string().optional(),
  engineDepth: z.number().optional(),

  // Accuracy statistics - all move classifications
  whiteAccuracy: z.number().nullable().optional(),
  blackAccuracy: z.number().nullable().optional(),
  whiteBrilliant: z.number().optional(),
  whiteSplendid: z.number().optional(),
  whitePerfect: z.number().optional(),
  whiteBest: z.number().optional(),
  whiteExcellent: z.number().optional(),
  whiteOkay: z.number().optional(),
  whiteOpening: z.number().optional(),
  whiteInaccuracy: z.number().optional(),
  whiteMistakes: z.number().optional(),
  whiteBlunders: z.number().optional(),
  blackBrilliant: z.number().optional(),
  blackSplendid: z.number().optional(),
  blackPerfect: z.number().optional(),
  blackBest: z.number().optional(),
  blackExcellent: z.number().optional(),
  blackOkay: z.number().optional(),
  blackOpening: z.number().optional(),
  blackInaccuracy: z.number().optional(),
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

  // New Settings
  engineMultiPv: z.number().optional(),
  showBestMove: z.boolean().optional(),
  showPlayerMove: z.boolean().optional(),
  boardHue: z.number().optional(),
  pieceSet: z.string().optional(),
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
        // Settings
        engineMultiPv: game.engineMultiPv,
        showBestMove: game.showBestMove,
        showPlayerMove: game.showPlayerMove,
        boardHue: game.boardHue,
        pieceSet: game.pieceSet,
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

          // Accuracy stats - all classifications
          whiteAccuracy: data.whiteAccuracy,
          blackAccuracy: data.blackAccuracy,
          whiteBrilliant: data.whiteBrilliant,
          whiteSplendid: data.whiteSplendid,
          whitePerfect: data.whitePerfect,
          whiteBest: data.whiteBest,
          whiteExcellent: data.whiteExcellent,
          whiteOkay: data.whiteOkay,
          whiteOpening: data.whiteOpening,
          whiteInaccuracy: data.whiteInaccuracy,
          whiteMistakes: data.whiteMistakes,
          whiteBlunders: data.whiteBlunders,
          blackBrilliant: data.blackBrilliant,
          blackSplendid: data.blackSplendid,
          blackPerfect: data.blackPerfect,
          blackBest: data.blackBest,
          blackExcellent: data.blackExcellent,
          blackOkay: data.blackOkay,
          blackOpening: data.blackOpening,
          blackInaccuracy: data.blackInaccuracy,
          blackMistakes: data.blackMistakes,
          blackBlunders: data.blackBlunders,

          // Opening
          openingECO: data.openingECO,
          openingName: data.openingName,

          // Move evaluations (JSON)
          moveEvaluations: data.moveEvaluations,

          // Legacy eval support
          eval: data.eval,

          // Settings
          engineMultiPv: data.engineMultiPv,
          showBestMove: data.showBestMove,
          showPlayerMove: data.showPlayerMove,
          boardHue: data.boardHue,
          pieceSet: data.pieceSet,
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
            fen: moment.fen || "",
            move: moment.move || "",
            bestMove: moment.bestMove,
            type: moment.type,
            evalBefore: moment.evalBefore ?? null,
            evalAfter: moment.evalAfter ?? null,
            evalDiff: moment.evalDiff ?? null,
            description: moment.description,
            // New fields
            commentaryEn: moment.commentaryEn,
            commentaryFr: moment.commentaryFr,
            playerColor: moment.playerColor,
            isUserMove: moment.isUserMove ?? false,
            bestLines: moment.bestLines ?? undefined,
            multiPvLines: moment.multiPvLines,
            positionContext: moment.positionContext,
            tactical: moment.tactical ?? false,
            themes: moment.themes ?? undefined,
            
            // Best line analysis
            bestLineDescription: moment.bestLineDescription,
            bestLineTheme: moment.bestLineTheme ? JSON.stringify(moment.bestLineTheme) : undefined,
            bestLinePositionContext: moment.bestLinePositionContext,
            globalDescription: moment.globalDescription,
          })),
        });
        
        console.log(`[API /analysis] Game ${gameId}: Successfully saved ${data.criticalMoments.length} critical moments to database`);
      } else {
        console.log(`[API /analysis] Game ${gameId}: No critical moments to save`);
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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return res
        .status(500)
        .json({ message: "Error saving analysis", error: errorMessage });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
