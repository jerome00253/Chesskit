import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Public endpoint - get active engines sorted by version
    const engines = await prisma.engine.findMany({
      where: { isActive: true },
      orderBy: [
        { isDefault: "desc" },
        { version: "desc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        identifier: true,
        version: true,
        type: true,
        filePath: true,
        isDefault: true,
      },
    });



    return res.status(200).json({ engines });
  } catch (error) {
    console.error("Error fetching active engines:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
