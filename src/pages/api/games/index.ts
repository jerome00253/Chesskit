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
        userColor,
        eval: evaluation,
      } = req.body;

      // Note: `eval` is a keyword in JS, so we rename it destructuring but schema uses `eval`

      // Fetch full user to get external usernames
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      let finalUserColor = userColor;

      // 1. Identity Matching Logic (case-insensitive)
      if (!finalUserColor && user) {
        const userName = user.name?.toLowerCase();
        const chessComUser = user.chesscomUsername?.toLowerCase();
        const lichessUser = user.lichessUsername?.toLowerCase();
        const bName = (blackName || "").toLowerCase();
        const wName = (whiteName || "").toLowerCase();

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
      }

      // 2. Average Rating Calculation (if identified)
      let finalWhiteRating = whiteRating ? parseInt(whiteRating) : null;
      let finalBlackRating = blackRating ? parseInt(blackRating) : null;
      let finalWhiteName = whiteName;
      let finalBlackName = blackName;

      if (finalUserColor && user?.name) {
        // Calculate today's average rating
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todaysGames = await prisma.game.findMany({
          where: {
            userId,
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
          select: {
            whiteName: true,
            whiteRating: true,
            blackName: true,
            blackRating: true,
            userColor: true,
          },
        });

        const userRating = (() => {
          if (todaysGames.length === 0) return 1200;

          const myRatings = todaysGames
            .map((g) => {
              if (g.userColor === "white") return g.whiteRating;
              if (g.userColor === "black") return g.blackRating;
              // Fallback if userColor not set but name matches (legacy)
              if (g.whiteName === user.name) return g.whiteRating;
              if (g.blackName === user.name) return g.blackRating;
              return null;
            })
            .filter((r): r is number => r !== null);

          if (myRatings.length === 0) return 1200;

          const sum = myRatings.reduce((a, b) => a + b, 0);
          return Math.round(sum / myRatings.length);
        })();

        // Update the user's side with local name and calculated rating
        if (finalUserColor === "white") {
          finalWhiteName = user.name;
          finalWhiteRating = userRating;
        } else {
          finalBlackName = user.name;
          finalBlackRating = userRating;
        }
      }

      let importOrigin = "other";
      const lowerSite = (site || "").toLowerCase();
      const lowerUrl = (req.body.gameUrl || "").toLowerCase(); // gameUrl might not be in destructuring above, need to check

      if (lowerSite.includes("lichess") || lowerUrl.includes("lichess")) {
        importOrigin = "lichess";
      } else if (
        lowerSite.includes("chess.com") ||
        lowerUrl.includes("chess.com")
      ) {
        importOrigin = "chesscom";
      }

      const game = await prisma.game.create({
        data: {
          userId,
          pgn,
          event,
          site,
          date,
          whiteName: finalWhiteName,
          whiteRating: finalWhiteRating,
          blackName: finalBlackName,
          blackRating: finalBlackRating,
          result,
          termination,
          timeControl,
          userColor: finalUserColor,
          eval: evaluation,
          // @ts-ignore: Stale Prisma client
          importOrigin,
        },
      });

      // Update user's Elo rating if we identified them in the game
      if (finalUserColor && user && result) {
        const {
          calculateNewRating,
          getUserGameResult,
          estimateOpponentRating,
        } = await import("@/lib/elo");

        // Determine game result from user's perspective
        const gameResult = getUserGameResult(result, finalUserColor);

        if (gameResult) {
          // Get opponent's rating
          const opponentRating = estimateOpponentRating(
            finalUserColor === "white" ? finalBlackRating : finalWhiteRating,
            undefined, // TODO: Could pass game accuracy if available
            1200
          );

          // Count user's total games for K-factor calculation
          const gamesCount = await prisma.game.count({
            where: { userId },
          });

          // Calculate new rating
          const newRating = calculateNewRating({
            currentRating: user.rating || 1200,
            opponentRating,
            result: gameResult,
            gamesPlayed: gamesCount,
          });

          // Update user's rating
          await prisma.user.update({
            where: { id: userId },
            data: { rating: newRating },
          });
        }
      }

      return res.status(201).json(game);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error saving game" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
