import { Game, CriticalMoment } from "@prisma/client";
import { generateGameAnalysis } from "./openai";

interface GameWithMoments extends Game {
  criticalMoments: CriticalMoment[];
}

export async function generateAIAnalysisForGame(game: GameWithMoments) {
  // Build prompt similar to /api/games/[id]/ai-analysis
  const whiteName = game.whiteName || "Blancs";
  const blackName = game.blackName || "Noirs";

  const criticalMomentsText = game.criticalMoments
    .slice(0, 10) // Limit to top 10 moments
    .map((m, idx) => {
      const themes = m.themes ? `Thèmes: ${m.themes}` : "";
      return `${idx + 1}. Coup ${Math.ceil(m.ply / 2)}: ${m.move} - ${(m as any).globalDescription || m.description}. Éval diff: ${m.evalDiff?.toFixed(2) || "N/A"}. ${themes}`;
    })
    .join("\n");

  const prompt = `Tu es un coach d'échecs expert.

Partie: ${whiteName} vs ${blackName}

Moments clés:
${criticalMomentsText}

Analyse cette partie et fournis:

===SUMMARY===
Un résumé global de la partie (3-4 phrases)

===KEY_MOMENTS===
Analyse détaillée des 3-4 moments les plus importants. Pour chaque coup important, écris le coup entre doubles crochets comme [[e4]] ou [[Nf3]] pour le rendre cliquable.

===ADVICE===
3-4 conseils concrets pour progresser

Ton: Pédagogique et encourageant. Maximum 400 mots au total.`;

  const analysisText = await generateGameAnalysis(prompt);

  // Parse the response
  const summaryMatch = analysisText.match(/===SUMMARY===\s*([\s\S]*?)(?===|$)/);
  const keyMomentsMatch = analysisText.match(/===KEY_MOMENTS===\s*([\s\S]*?)(?===|$)/);
  const adviceMatch = analysisText.match(/===ADVICE===\s*([\s\S]*?)(?===|$)/);

  return {
    summary: summaryMatch ? summaryMatch[1].trim() : "",
    keyMoments: keyMomentsMatch ? keyMomentsMatch[1].trim() : "",
    advice: adviceMatch ? adviceMatch[1].trim() : "",
    fullText: analysisText,
  };
}
