import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  chesscomUsername: z.string().optional().nullable(),
  lichessUsername: z.string().optional().nullable(),
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
        },
      });
      return res.status(200).json(user);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return res.status(500).json({ message: "Error fetching profile" });
    }
  }

  if (req.method === "PATCH") {
    try {
      const data = profileSchema.parse(req.body);

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          firstName: data.firstName,
          lastName: data.lastName,
          chesscomUsername: data.chesscomUsername,
          lichessUsername: data.lichessUsername,
        },
      });

      return res.status(200).json(user);
    } catch (error) {
      console.error("Failed to update profile:", error);
      return res.status(500).json({ message: "Error updating profile" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
