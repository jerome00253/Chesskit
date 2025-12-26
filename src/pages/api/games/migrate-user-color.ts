import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userId = session.user.id;

  if (req.method === "POST") {
    try {
      // Fetch user profile with external usernames
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Fetch all games without userColor set
      const games = await prisma.game.findMany({
        where: {
          userId,
          userColor: null,
        },
      });

      let updatedCount = 0;

      // Apply matching logic to each game
      for (const game of games) {
        let finalUserColor: "white" | "black" | null = null;

        // Identity matching logic (same as in POST /api/games)
        const userName = user.name?.toLowerCase();
        const chessComUser = user.chesscomUsername?.toLowerCase();
        const lichessUser = user.lichessUsername?.toLowerCase();
        const bName = (game.blackName || "").toLowerCase();
        const wName = (game.whiteName || "").toLowerCase();

        const isBlack =
          (userName && bName.includes(userName)) ||
          (chessComUser && bName === chessComUser) ||
          (lichessUser && bName === lichessUser);

        const isWhite =
          (userName && wName.includes(userName)) ||
          (chessComUser && wName === chessComUser) ||
          (lichessUser && wName === lichessUser);

        if (isBlack) finalUserColor = "black";
        else if (isWhite) finalUserColor = "white";

        // Update if we found a match
        if (finalUserColor) {
          await prisma.game.update({
            where: { id: game.id },
            data: { userColor: finalUserColor },
          });
          updatedCount++;
        }
      }

      return res.status(200).json({
        message: `Successfully updated ${updatedCount} game(s)`,
        updatedCount,
        totalProcessed: games.length,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error migrating games" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
