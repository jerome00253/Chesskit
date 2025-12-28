import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication and admin role
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden - Admin only" });
  }

  // Handle different HTTP methods
  if (req.method === "GET") {
    // GET - List all engines (admin only)
    const engines = await prisma.engine.findMany({
      orderBy: [
        { isDefault: 'desc' },  // Default first
        { version: 'desc' },     // Then by version (highest to lowest)
        { name: 'asc' }          // Then alphabetically
      ],
    });
    return res.status(200).json({ engines });
  }

  if (req.method === "POST") {
    // Create new engine
    const { name, identifier, version, type, filePath, isActive, isDefault } = req.body;

    // Validation
    if (!name || !identifier || !version || !type || !filePath) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check identifier uniqueness
    const existing = await prisma.engine.findUnique({
      where: { identifier },
    });

    if (existing) {
      return res.status(400).json({ message: "Identifier already exists" });
    }

    // If setting as default, unset current default
    if (isDefault) {
      await prisma.engine.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const engine = await prisma.engine.create({
      data: {
        name,
        identifier,
        version,
        type,
        filePath,
        isActive: isActive ?? true,
        isDefault: isDefault ?? false,
      },
    });

    return res.status(201).json({ engine });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
