import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generateGameAnalysis } from "@/lib/ai/openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { id } = req.query;
  const gameId = parseInt(id as string);

  if (isNaN(gameId)) {
    return res.status(400).json({ message: "Invalid game ID" });
  }

  try {
    // 0. Check User Settings
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.email) {
       const user = await prisma.user.findUnique({
         where: { email: session.user.email },
         select: { analysisSettings: true },
       });
       const analysisSettings = (user?.analysisSettings as Record<string, any>) || {};
       if (analysisSettings.enableAI === false) {
         return res.status(403).json({ message: "AI Analysis disabled in user settings" });
       }
    }

    // 1. Fetch Game and Critical Moments
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        criticalMoments: {
          orderBy: { ply: "asc" },
        },
      },
    });

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    if (!game.pgn) {
      return res.status(400).json({ message: "Game has no PGN" });
    }

    // 2. Construct Prompt
    const momentsSummary = game.criticalMoments
      .map((m) => {
        let desc = `- Coup ${m.ply} (${m.move}): ${m.type}`;
        if (m.description) desc += ` - ${m.description}`;
        if (m.tactical && Array.isArray(m.themes)) desc += ` (Tactique: ${m.themes.join(", ")})`;
        return desc;
      })
      .join("\n");
    
    // Determine player names or fallback
    const whiteName = game.whiteName || "Joueur Blanc";
    const blackName = game.blackName || "Joueur Noir";
    const userColorfr = game.userColor === "white" ? "BLANCS" : "NOIRS";
    const userPlayerName = game.userColor === "white" ? whiteName : blackName;

    const prompt = `
Tu es un coach d'échecs expert et bienveillant. Analyse cette partie entre **${whiteName} (Blancs)** et **${blackName} (Noirs)**.

Voici le PGN de la partie :
${game.pgn}

Voici les moments critiques identifiés par le moteur :
${momentsSummary}

Tâche :
Analyse la partie et fournis la réponse en 3 sections distinctes séparées par des marqueurs spécifiques.

Structure requise :
===SUMMARY===
(Fais un résumé global de la partie : ouverture, milieu de jeu, finale).
===KEY_MOMENTS===
(Analyse les moments clés : erreurs et coups brillants en expliquant pourquoi c'était bon ou mauvais).
===ADVICE===
(Donne 3 conseils concrets pour **${userPlayerName}** qui jouait les ${userColorfr}).

**IMPORTANT :**
- Lorsque tu cites un coup spécifique (ex: e4, Nf3, exd5), entoure-le TOUJOURS de doubles crochets comme ceci : **[[e4]]**, **[[Nf3]]**. Cela permettra de créer des liens cliquables.
- Cite les noms des joueurs pour rendre l'analyse plus vivante.
- Réponds en Markdown dans chaque section.
    `.trim();

    // 3. Call OpenAI
    const analysisText = await generateGameAnalysis(prompt);

    // 4. Parse Response
    const summaryMatch = analysisText.match(/===SUMMARY===([\s\S]*?)(?:===KEY_MOMENTS===|$)/);
    const keyMomentsMatch = analysisText.match(/===KEY_MOMENTS===([\s\S]*?)(?:===ADVICE===|$)/);
    const adviceMatch = analysisText.match(/===ADVICE===([\s\S]*?)$/);

    const aiSummary = summaryMatch ? summaryMatch[1].trim() : "";
    const aiKeyMoments = keyMomentsMatch ? keyMomentsMatch[1].trim() : "";
    const aiAdvice = adviceMatch ? adviceMatch[1].trim() : "";

    // Fallback if parsing fails (store everything in summary or keeps legacy behavior)
    // If structured parsing fails completely, we just put everything in aiAnalysis as before, 
    // but here we try to populate the new fields.

    // 5. Save to DB
    // @ts-ignore - aiAnalysis added to schema but client might not be fully updated in IDE
    await prisma.game.update({
      where: { id: gameId },
      data: {
        aiAnalysis: analysisText, // Keep full text for backup/legacy
        aiSummary,
        aiKeyMoments,
        aiAdvice,
      },
    });

    return res.status(200).json({ 
        analysis: analysisText,
        uniqueSegments: {
            summary: aiSummary,
            keyMoments: aiKeyMoments,
            advice: aiAdvice
        }
    });


  } catch (error) {
    console.error("AI Analysis Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
