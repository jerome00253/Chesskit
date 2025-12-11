import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { platform, username } = req.body;

  if (!platform || !username) {
    return res.status(400).json({ message: "Platform and username required" });
  }

  try {
    let valid = false;

    if (platform === "chesscom") {
      // Chess.com API: https://api.chess.com/pub/player/{username}
      const response = await fetch(
        `https://api.chess.com/pub/player/${username.toLowerCase()}`
      );
      valid = response.ok;
    } else if (platform === "lichess") {
      // Lichess API: https://lichess.org/api/user/{username}
      const response = await fetch(
        `https://lichess.org/api/user/${username.toLowerCase()}`
      );
      valid = response.ok;
    } else {
      return res.status(400).json({ message: "Invalid platform" });
    }

    return res.status(200).json({ valid });
  } catch (error) {
    console.error("Failed to verify account:", error);
    return res.status(500).json({ message: "Error verifying account" });
  }
}
