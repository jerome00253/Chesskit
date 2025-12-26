import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

/**
 * Cron endpoint for server-side auto-import
 * This should be called periodically by a cron service (Vercel Cron, cron-job.org, etc.)
 * 
 * Security: Add API key verification in production
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Optional: API key verification for production
  const apiKey = req.headers.authorization?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && apiKey !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const now = new Date();
    const results = {
      totalUsers: 0,
      usersProcessed: 0,
      totalImported: 0,
      errors: 0,
    };

    // Find all users with auto-import enabled
    const users = await prisma.user.findMany({
      where: {
        autoImportEnabled: true,
      },
      select: {
        id: true,
        email: true,
        autoImportInterval: true,
        lastAutoImport: true,
        chesscomUsername: true,
        lichessUsername: true,
        autoImportPlatforms: true,
      },
    });

    results.totalUsers = users.length;

    // Process each user
    for (const user of users) {
      try {
        // Check if enough time has passed since last import
        if (user.lastAutoImport) {
          const timeSinceLastImport =
            (now.getTime() - new Date(user.lastAutoImport).getTime()) / 1000;
          const interval = user.autoImportInterval || 21600; // 6 hours default

          if (timeSinceLastImport < interval) {
            // Skip this user - not enough time passed
            continue;
          }
        }

        const platforms = (user.autoImportPlatforms as { chesscom?: boolean; lichess?: boolean }) || {
          chesscom: true,
          lichess: true,
        };

        let userImported = 0;

        // Import from Chess.com
        if (platforms.chesscom && user.chesscomUsername) {
          try {
            const response = await fetch(
              `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/games/import-bulk`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  platform: "chesscom",
                  username: user.chesscomUsername,
                  since: user.lastAutoImport,
                  limit: 50,
                  userId: user.id, // Pass user ID for server-side auth
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              userImported += data.imported || 0;
            }
          } catch (error) {
            console.error(`Chess.com import error for user ${user.email}:`, error);
            results.errors++;
          }
        }

        // Import from Lichess
        if (platforms.lichess && user.lichessUsername) {
          try {
            const response = await fetch(
              `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/games/import-bulk`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  platform: "lichess",
                  username: user.lichessUsername,
                  since: user.lastAutoImport,
                  limit: 50,
                  userId: user.id,
                }),
              }
            );

            if (response.ok) {
              const data = await response.json();
              userImported += data.imported || 0;
            }
          } catch (error) {
            console.error(`Lichess import error for user ${user.email}:`, error);
            results.errors++;
          }
        }

        // Update lastAutoImport timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastAutoImport: now },
        });

        results.usersProcessed++;
        results.totalImported += userImported;

        console.log(
          `Auto-import completed for ${user.email}: ${userImported} games imported`
        );
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        results.errors++;
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("Cron auto-import error:", error);
    return res.status(500).json({
      success: false,
      message: "Cron auto-import failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
