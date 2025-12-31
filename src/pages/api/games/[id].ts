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

  if (req.method === "GET") {
    try {
      // Fetch the game
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: { criticalMoments: true },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      // Ensure the game belongs to the user
      if (game.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      return res.status(200).json(game);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error fetching game" });
    }
  } else if (req.method === "DELETE") {
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

      // Soft delete: set active to false instead of deleting
      await prisma.game.update({
        where: { id: gameId },
        data: { active: false },
      });

      return res.status(200).json({ message: "Game deactivated" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error deactivating game" });
    }
  } else if (req.method === "PUT") {
    // Reactivate game (set active to true)
    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      if (game.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await prisma.game.update({
        where: { id: gameId },
        data: { active: true },
      });

      return res.status(200).json({ message: "Game reactivated" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error reactivating game" });
    }
  } else if (req.method === "PATCH") {
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

      const {
        event,
        site,
        date,
        round,
        whiteName,
        whiteRating,
        blackName,
        blackRating,
        result,
        userColor,
      } = req.body;

      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          event,
          site,
          date,
          round,
          whiteName,
          whiteRating: whiteRating ? parseInt(whiteRating) : undefined,
          blackName,
          blackRating: blackRating ? parseInt(blackRating) : undefined,
          result,
          userColor,
        },
      });

      return res.status(200).json(updatedGame);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error updating game" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
