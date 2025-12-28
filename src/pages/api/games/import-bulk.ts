import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { platform, username: rawUsername } = req.body;
  const username = rawUsername?.trim(); // Remove leading/trailing spaces

  if (!platform || !username) {
    return res.status(400).json({ message: "Platform and username required" });
  }

  try {
    const games = [];
    let imported = 0;
    let skipped = 0;

    // Fetch user profile to get app nickname
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    const userAppNickname = userProfile?.name || "Me";

    // Fetch user's existing games to check for duplicates
    const existingGames = await prisma.game.findMany({
      where: { userId: session.user.id },
      select: { pgn: true },
    });

    const existingPgns = new Set(
      existingGames.map((g: { pgn: string }) => g.pgn)
    );

    if (platform === "chesscom") {
      // Fetch games from Chess.com API
      const archivesRes = await fetch(
        `https://api.chess.com/pub/player/${username}/games/archives`
      );

      if (!archivesRes.ok) {
        return res
          .status(400)
          .json({ message: "Failed to fetch Chess.com archives" });
      }

      const { archives } = await archivesRes.json();

      // Limit to last 3 months to avoid overwhelming
      const recentArchives = archives.slice(-3);

      for (const archiveUrl of recentArchives) {
        const gamesRes = await fetch(archiveUrl);
        if (gamesRes.ok) {
          const { games: monthGames } = await gamesRes.json();
          games.push(...monthGames);
        }
      }

      // Import games with duplicate detection
      for (const game of games) {
        // Chess.com API returns pgn directly in game object
        if (!game || !game.pgn) {
          skipped++;
          continue;
        }

        const pgn = game.pgn;

        if (existingPgns.has(pgn)) {
          skipped++;
          continue;
        }

        // Parse PGN headers
        const whiteMatch = pgn.match(/\[White "([^"]+)"\]/);
        const blackMatch = pgn.match(/\[Black "([^"]+)"\]/);
        const resultMatch = pgn.match(/\[Result "([^"]+)"\]/);
        const dateMatch = pgn.match(/\[Date "([^"]+)"\]/);
        const eventMatch = pgn.match(/\[Event "([^"]+)"\]/);
        const siteMatch = pgn.match(/\[Site "([^"]+)"\]/);

        let whiteName = whiteMatch ? whiteMatch[1] : "Unknown";
        let blackName = blackMatch ? blackMatch[1] : "Unknown";
        const result = resultMatch ? resultMatch[1] : "*";

        // Extract additional fields
        const whiteEloMatch = pgn.match(/\[WhiteElo "([^"]+)"\]/);
        const blackEloMatch = pgn.match(/\[BlackElo "([^"]+)"\]/);
        const timeControlMatch = pgn.match(/\[TimeControl "([^"]+)"\]/);
        const terminationMatch = pgn.match(/\[Termination "([^"]+)"\]/);
        const linkMatch = pgn.match(/\[Link "([^"]+)"\]/);
        const ecoUrlMatch = pgn.match(/\[ECOUrl "([^"]+)"\]/);

        const whiteElo = whiteEloMatch ? parseInt(whiteEloMatch[1]) : null;
        const blackElo = blackEloMatch ? parseInt(blackEloMatch[1]) : null;
        const timeControl = timeControlMatch ? timeControlMatch[1] : null;
        const termination = terminationMatch ? terminationMatch[1] : null;
        const gameUrl = linkMatch
          ? linkMatch[1]
          : siteMatch
            ? siteMatch[1]
            : null;
        const ecoUrl = ecoUrlMatch ? ecoUrlMatch[1] : null;

        // Parse TimeControl into initialTime and increment (e.g., "180+0" => 180s initial, 0s increment)
        let initialTime: number | null = null;
        let increment: number | null = null;
        if (timeControl && timeControl !== "-" && timeControl !== "?") {
          const parts = timeControl.split("+");
          if (parts.length >= 1) {
            initialTime = parseInt(parts[0]) || null;
          }
          if (parts.length >= 2) {
            increment = parseInt(parts[1]) || null;
          }
        }

        // Parse date (PGN format YYYY.MM.DD -> ISO Date)
        let gameDate: Date | null = null;
        if (dateMatch && dateMatch[1] && dateMatch[1].indexOf("?") === -1) {
          try {
            // Replace dots with dashes: "2025.12.24" -> "2025-12-24"
            const isoDateStr = dateMatch[1].replace(/\./g, "-");
            gameDate = new Date(isoDateStr);
            // Verify if date is valid
            if (isNaN(gameDate.getTime())) {
              gameDate = null;
            }
          } catch (e) {
            console.error("Invalid date:", dateMatch[1]);
          }
        }

        // Determine userColor and replace username with app nickname
        let userColor: "white" | "black" | null = null;
        if (whiteName.toLowerCase() === username.toLowerCase()) {
          userColor = "white";
          whiteName = userAppNickname; // Replace with app nickname
        } else if (blackName.toLowerCase() === username.toLowerCase()) {
          userColor = "black";
          blackName = userAppNickname; // Replace with app nickname
        }

        await prisma.game.create({
          data: {
            userId: session.user.id,
            pgn,
            whiteName,
            whiteRating: whiteElo,
            blackName,
            blackRating: blackElo,
            result,
            date: gameDate,
            event: eventMatch ? eventMatch[1] : "Chess.com",
            site: siteMatch ? siteMatch[1] : "Chess.com",
            userColor,
            timeControl,
            termination,
            initialTime,
            increment,
            gameUrl,
            ecoUrl,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: Stale Prisma client
            importOrigin: "chesscom",
          },
        });

        imported++;
        existingPgns.add(pgn);
      }
    } else if (platform === "lichess") {
      // Fetch games from Lichess API
      const gamesRes = await fetch(
        `https://lichess.org/api/games/user/${username}?max=100&pgnInJson=true`,
        {
          headers: { Accept: "application/x-ndjson" },
        }
      );

      if (!gamesRes.ok) {
        return res
          .status(400)
          .json({ message: "Failed to fetch Lichess games" });
      }

      const text = await gamesRes.text();
      const gamesData = text
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));

      for (const game of gamesData) {
        const pgn = game.pgn;

        if (existingPgns.has(pgn)) {
          skipped++;
          continue;
        }

        // Parse PGN
        const whiteMatch = pgn.match(/\[White "([^"]+)"\]/);
        const blackMatch = pgn.match(/\[Black "([^"]+)"\]/);
        const resultMatch = pgn.match(/\[Result "([^"]+)"\]/);
        const dateMatch = pgn.match(/\[UTCDate "([^"]+)"\]/);
        const eventMatch = pgn.match(/\[Event "([^"]+)"\]/);
        const siteMatch = pgn.match(/\[Site "([^"]+)"\]/);

        let whiteName = whiteMatch ? whiteMatch[1] : "Unknown";
        let blackName = blackMatch ? blackMatch[1] : "Unknown";
        const result = resultMatch ? resultMatch[1] : "*";

        // Extract additional fields
        const whiteEloMatch = pgn.match(/\[WhiteElo "([^"]+)"\]/);
        const blackEloMatch = pgn.match(/\[BlackElo "([^"]+)"\]/);
        const timeControlMatch = pgn.match(/\[TimeControl "([^"]+)"\]/);
        const terminationMatch = pgn.match(/\[Termination "([^"]+)"\]/);
        const linkMatch =
          pgn.match(/\[Link "([^"]+)"\]/) || pgn.match(/\[Site "([^"]+)"\]/);
        const ecoUrlMatch = pgn.match(/\[ECOUrl "([^"]+)"\]/);

        const whiteElo = whiteEloMatch ? parseInt(whiteEloMatch[1]) : null;
        const blackElo = blackEloMatch ? parseInt(blackEloMatch[1]) : null;
        const timeControl = timeControlMatch ? timeControlMatch[1] : null;
        const termination = terminationMatch ? terminationMatch[1] : null;
        const gameUrl = linkMatch ? linkMatch[1] : null;
        const ecoUrl = ecoUrlMatch ? ecoUrlMatch[1] : null;

        // Parse TimeControl into initialTime and increment (e.g., "180+0" => 180s initial, 0s increment)
        let initialTime: number | null = null;
        let increment: number | null = null;
        if (timeControl && timeControl !== "-" && timeControl !== "?") {
          const parts = timeControl.split("+");
          if (parts.length >= 1) {
            initialTime = parseInt(parts[0]) || null;
          }
          if (parts.length >= 2) {
            increment = parseInt(parts[1]) || null;
          }
        }

        // Determine userColor and replace username with app nickname
        let userColor: "white" | "black" | null = null;
        if (whiteName.toLowerCase() === username.toLowerCase()) {
          userColor = "white";
          whiteName = userAppNickname; // Replace with app nickname
        } else if (blackName.toLowerCase() === username.toLowerCase()) {
          userColor = "black";
          blackName = userAppNickname; // Replace with app nickname
        }

        // Parse date (PGN format YYYY.MM.DD or YYYY-MM-DD -> ISO Date)
        let gameDate: Date | null = null;
        if (dateMatch && dateMatch[1] && dateMatch[1].indexOf("?") === -1) {
          try {
            // Replace dots with dashes: "2025.12.24" -> "2025-12-24"
            const isoDateStr = dateMatch[1].replace(/\./g, "-");
            gameDate = new Date(isoDateStr);
            // Verify if date is valid
            if (isNaN(gameDate.getTime())) {
              gameDate = null;
            }
          } catch (e) {
            console.error("Invalid date:", dateMatch[1]);
          }
        }

        await prisma.game.create({
          data: {
            userId: session.user.id,
            pgn,
            whiteName,
            whiteRating: whiteElo,
            blackName,
            blackRating: blackElo,
            result,
            date: gameDate,
            event: eventMatch ? eventMatch[1] : "Lichess",
            site: siteMatch ? siteMatch[1] : "Lichess.org",
            userColor,
            timeControl,
            termination,
            initialTime,
            increment,
            gameUrl,
            ecoUrl,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore: Stale Prisma client
            importOrigin: "lichess",
          },
        });

        imported++;
        existingPgns.add(pgn);
      }
    }

    return res.status(200).json({
      message: "Import completed",
      imported,
      skipped,
      total: games.length || imported + skipped,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return res.status(500).json({
      message: "Import failed",
      error: error.message,
      details: error.meta || error.code,
    });
  }
}
