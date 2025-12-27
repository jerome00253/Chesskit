import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  chesscomUsername: z.string().optional().nullable(),
  lichessUsername: z.string().optional().nullable(),
  preferredLocale: z
    .enum(["en", "fr", "de", "it", "pt", "es", "nl"])
    .optional(),
});

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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          firstName: true,
          lastName: true,
          chesscomUsername: true,
          lichessUsername: true,
          email: true,
          timeSettings: true,
          preferredLocale: true,
        },
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(200).json(user);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return res.status(500).json({ message: "Error fetching profile" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const data = profileSchema.parse(req.body);

      // Use a transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Get the old user data before update
        const oldUser = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        // 2. Update user profile
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            name: data.name,
            firstName: data.firstName,
            lastName: data.lastName,
            chesscomUsername: data.chesscomUsername,
            lichessUsername: data.lichessUsername,
            preferredLocale: data.preferredLocale,
          },
        });

        // 3. If name changed, update all games owned by this user (Option A)
        if (oldUser?.name && data.name && oldUser.name !== data.name) {
          // Update games where user played as white
          await tx.game.updateMany({
            where: {
              userId: userId,
              whiteName: oldUser.name,
            },
            data: {
              whiteName: data.name,
            },
          });

          // Update games where user played as black
          await tx.game.updateMany({
            where: {
              userId: userId,
              blackName: oldUser.name,
            },
            data: {
              blackName: data.name,
            },
          });

          console.log(
            `Updated username from "${oldUser.name}" to "${data.name}" across user's games`
          );
        }

        return updatedUser;
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Failed to update profile:", error);
      return res.status(500).json({ message: "Error updating profile" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
