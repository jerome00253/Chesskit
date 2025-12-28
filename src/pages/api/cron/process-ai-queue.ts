import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generateAIAnalysisForGame } from "@/lib/ai/generateAnalysis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Security: Check cron secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // 1. Fetch games that need AI analysis
    const games = await prisma.game.findMany({
      where: {
        analyzed: true,
        needsAiAnalysis: true,
        aiSummary: null, // Don't reprocess if already done
      },
      orderBy: { aiAnalysisQueuedAt: "asc" },
      take: 10,
      include: {
        criticalMoments: {
          orderBy: { evalDiff: "desc" },
          take: 10,
        },
      },
    });

    let processed = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    // 2. Process each game
    for (const game of games) {
      try {
        console.log(`Processing AI analysis for game ${game.id}...`);

        // Generate AI analysis
        const analysis = await generateAIAnalysisForGame(game);

        // Save to database
        await prisma.game.update({
          where: { id: game.id },
          data: {
            aiSummary: analysis.summary,
            aiKeyMoments: analysis.keyMoments,
            aiAdvice: analysis.advice,
            aiAnalysis: analysis.fullText,
            needsAiAnalysis: false,
          },
        });

        processed++;
        console.log(`✓ Game ${game.id} processed successfully`);

        // Rate limiting: 2 second pause between requests
        if (processed < games.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        errors++;
        const errorMsg = `Game ${game.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`✗ ${errorMsg}`);
        errorDetails.push(errorMsg);

        // Don't halt the entire batch on one error
        continue;
      }
    }

    // 3. Return summary
    return res.status(200).json({
      success: true,
      processed,
      errors,
      total: games.length,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
