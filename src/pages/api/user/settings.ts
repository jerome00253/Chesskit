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

  if (req.method === "GET") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { analysisSettings: true },
      });
      return res.status(200).json(user?.analysisSettings || {});
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error fetching settings" });
    }
  }

  if (req.method === "POST") {
    try {
      const settings = req.body;
      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          analysisSettings: settings,
        },
      });
      return res.status(200).json({ success: true, settings: user.analysisSettings });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error saving settings" });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}
