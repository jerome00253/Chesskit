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

  if (req.method === "GET") {
    try {
      const games = await prisma.game.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return res.status(200).json(games);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error fetching games" });
    }
  } else if (req.method === "POST") {
    try {
      const {
        pgn,
        event,
        site,
        date,
        whiteName,
        whiteRating,
        blackName,
        blackRating,
        result,
        termination,
        timeControl,
        eval: evaluation,
      } = req.body;

      // Note: `eval` is a keyword in JS, so we rename it destructuring but schema uses `eval`

      const game = await prisma.game.create({
        data: {
          userId,
          pgn,
          event,
          site,
          date,
          whiteName,
          whiteRating: whiteRating ? parseInt(whiteRating) : null,
          blackName,
          blackRating: blackRating ? parseInt(blackRating) : null,
          result,
          termination,
          timeControl,
          eval: evaluation,
        },
      });
      return res.status(201).json(game);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error saving game" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
