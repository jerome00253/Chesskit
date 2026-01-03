import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { result, opponentElo } = req.body;

  if (typeof result !== "number" || typeof opponentElo !== "number") {
    return res.status(400).json({ message: "Invalid input" });
  }

  // Result: 1 for win, 0 for loss, 0.5 for draw
  if (![0, 0.5, 1].includes(result)) {
      return res.status(400).json({ message: "Invalid result value" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentElo = user.rating || 1200;
    const K = 20; // K-factor

    // Calculate Expected Store
    // E_a = 1 / (1 + 10 ^ ((R_b - R_a) / 400))
    const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - currentElo) / 400));

    // Calculate New Rating
    // R_a' = R_a + K * (S_a - E_a)
    const newElo = Math.round(currentElo + K * (result - expectedScore));

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { rating: newElo },
    });

    return res.status(200).json({ newElo: updatedUser.rating, oldElo: currentElo });
  } catch (error) {
    console.error("Error updating ELO:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
