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
  const gameId = parseInt(req.query.id as string);

  if (isNaN(gameId)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  if (req.method === "DELETE") {
    try {
      // Ensure the game belongs to the user
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await prisma.game.delete({
        where: { id: gameId },
      });

      return res.status(200).json({ message: "Game deleted" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error deleting game" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
