import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { gameIds } = req.body;

  if (!Array.isArray(gameIds) || gameIds.length === 0) {
    return res.status(400).json({ message: "Invalid gameIds array" });
  }

  try {
    // Delete only user's own games for security
    const result = await prisma.game.deleteMany({
      where: {
        id: { in: gameIds },
        userId: session.user.id,
      },
    });

    return res.status(200).json({
      success: true,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return res.status(500).json({ message: "Bulk delete failed" });
  }
}
