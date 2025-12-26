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

  const { force = false } = req.body;

  try {
    // Get user settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        autoImportEnabled: true,
        autoImportPlatforms: true,
        autoImportInterval: true,
        lastAutoImport: true,
        chesscomUsername: true,
        lichessUsername: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if auto-import is enabled
    if (!user.autoImportEnabled && !force) {
      return res.status(400).json({ message: "Auto-import is not enabled" });
    }

    // Check if enough time has passed since last import
    if (!force && user.lastAutoImport) {
      const timeSinceLastImport =
        (Date.now() - new Date(user.lastAutoImport).getTime()) / 1000;
      if (timeSinceLastImport < (user.autoImportInterval || 21600)) {
        return res.status(400).json({
          message: "Not enough time since last import",
          nextImport: new Date(
            new Date(user.lastAutoImport).getTime() +
              (user.autoImportInterval || 21600) * 1000
          ),
        });
      }
    }

    const platforms = (user.autoImportPlatforms as { chesscom?: boolean; lichess?: boolean }) || {
      chesscom: true,
      lichess: true,
    };

    const results = {
      chesscom: { imported: 0, skipped: 0 },
      lichess: { imported: 0, skipped: 0 },
    };

    // Import from Chess.com
    if (platforms.chesscom && user.chesscomUsername) {
      try {
        const response = await fetch(
          `${req.headers.origin || "http://localhost:3000"}/api/games/import-bulk`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: req.headers.cookie || "",
            },
            body: JSON.stringify({
              platform: "chesscom",
              username: user.chesscomUsername,
              since: user.lastAutoImport,
              limit: 50, // Limit for auto-import
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.chesscom.imported = data.imported || 0;
          results.chesscom.skipped = data.skipped || 0;
        }
      } catch (error) {
        console.error("Chess.com auto-import error:", error);
      }
    }

    // Import from Lichess
    if (platforms.lichess && user.lichessUsername) {
      try {
        const response = await fetch(
          `${req.headers.origin || "http://localhost:3000"}/api/games/import-bulk`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: req.headers.cookie || "",
            },
            body: JSON.stringify({
              platform: "lichess",
              username: user.lichessUsername,
              since: user.lastAutoImport,
              limit: 50,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          results.lichess.imported = data.imported || 0;
          results.lichess.skipped = data.skipped || 0;
        }
      } catch (error) {
        console.error("Lichess auto-import error:", error);
      }
    }

    // Update lastAutoImport
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastAutoImport: new Date() },
    });

    return res.status(200).json({
      success: true,
      imported: results,
      lastImport: new Date(),
    });
  } catch (error) {
    console.error("Auto-import error:", error);
    return res.status(500).json({ message: "Auto-import failed" });
  }
}
