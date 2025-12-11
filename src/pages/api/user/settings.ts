import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const timeSettingsSchema = z.object({
  bulletMax: z.number().min(1).max(10),
  blitzMax: z.number().min(5).max(20),
  rapidMax: z.number().min(15).max(120),
});

const settingsSchema = z.object({
  timeSettings: timeSettingsSchema.optional(),
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

  if (req.method === "PATCH") {
    try {
      const data = settingsSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          timeSettings: data.timeSettings,
        },
      });

      return res.status(200).json(user);
    } catch (error) {
      console.error("Failed to update settings:", error);
      return res.status(500).json({ message: "Error updating settings" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
