import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { generateGameAnalysis } from "@/lib/ai/openai";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // 1. Authentification
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2. Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const analysisSettings = (user.analysisSettings as Record<string, any>) || {};
    // If enableAI is explicitly false, prevent analysis
    if (analysisSettings.enableAI === false) {
      return res.status(403).json({ message: "AI Analysis disabled in user settings" });
    }

    // 3. Récupérer les 10 dernières parties avec aiAdvice
    const games = await prisma.game.findMany({
      where: {
        userId: user.id,
        analyzed: true,
        aiAdvice: { not: null },
      },
      orderBy: { analyzedAt: "desc" },
      take: 10,
      select: {
        id: true,
        whiteName: true,
        blackName: true,
        userColor: true,
        aiAdvice: true,
        date: true,
      },
    });

    if (games.length === 0) {
      return res.status(200).json({
        summary: "Aucune partie analysée avec des conseils IA disponibles.",
      });
    }

    // 4. Construire le prompt
    const adviceList = games
      .map((g, idx) => {
        const userName = g.userColor === "white" ? g.whiteName : g.blackName;
        return `**Partie ${idx + 1}** (${userName || "Vous"}):\n${g.aiAdvice}`;
      })
      .join("\n\n");

    const prompt = `Tu es un coach d'échecs expert et bienveillant.

Voici les conseils que tu as donnés à cet élève sur ses ${games.length} dernières parties :

${adviceList}

Tâche :
Synthétise ces conseils en identifiant 3-4 points récurrents et concrets à travailler.
Sois encourageant et spécifique. Format Markdown avec des listes à puces.

Structure :
## 🎯 Vos axes de progression

[3-4 points clés avec conseils concrets]

Ton: Pédagogique et motivant. Maximum 200 mots.`;

    // 5. Appel OpenAI
    const summary = await generateGameAnalysis(prompt);

    // 6. Sauvegarder dans User
    await prisma.user.update({
      where: { id: user.id },
      data: { conseilsIA: summary },
    });

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Coaching Summary Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
