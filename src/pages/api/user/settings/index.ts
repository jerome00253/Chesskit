import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
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
        select: {
          timeSettings: true,
          analysisSettings: true,
        },
      });
      return res.status(200).json({
        timeSettings: user?.timeSettings || null,
        analysisSettings: user?.analysisSettings || null,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error fetching settings" });
    }
  }

  if (req.method === "POST" || req.method === "PATCH") {
    try {
      const { timeSettings, analysisSettings } = req.body;

      // Préparer les données à mettre à jour
      const updateData: any = {};
      if (timeSettings !== undefined) updateData.timeSettings = timeSettings;
      if (analysisSettings !== undefined)
        updateData.analysisSettings = analysisSettings;

      const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
      });

      return res.status(200).json({
        success: true,
        timeSettings: user.timeSettings,
        analysisSettings: user.analysisSettings,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error saving settings" });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}
