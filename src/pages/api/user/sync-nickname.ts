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
      // Fetch user to get current nickname
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.name) {
        return res.status(404).json({ message: "User or nickname not found" });
      }

      const newNickname = user.name;

      // Find all games where user is identified (has userColor set)
      const whiteGames = await prisma.game.updateMany({
        where: {
          userId,
          userColor: "white",
        },
        data: {
          whiteName: newNickname,
        },
      });

      const blackGames = await prisma.game.updateMany({
        where: {
          userId,
          userColor: "black",
        },
        data: {
          blackName: newNickname,
        },
      });

      const totalUpdated = whiteGames.count + blackGames.count;

      return res.status(200).json({
        message: `Successfully synced ${totalUpdated} game(s)`,
        updatedCount: totalUpdated,
        whiteGames: whiteGames.count,
        blackGames: blackGames.count,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error syncing nickname" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
