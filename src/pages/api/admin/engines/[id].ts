import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const engineId = parseInt(id as string);

  if (isNaN(engineId)) {
    return res.status(400).json({ message: "Invalid engine ID" });
  }

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

  if (req.method === "PUT") {
    // Update engine
    const { name, isActive, isDefault } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    // If setting as default, unset current default
    if (isDefault === true) {
      await prisma.engine.updateMany({
        where: { isDefault: true, id: { not: engineId } },
        data: { isDefault: false },
      });
    }

    const engine = await prisma.engine.update({
      where: { id: engineId },
      data: updateData,
    });

    return res.status(200).json({ engine });
  }

  if (req.method === "DELETE") {
    // 1. Get engine info
    const engine = await prisma.engine.findUnique({
      where: { id: engineId },
    });

    if (!engine) {
        return res.status(404).json({ message: "Engine not found" });
    }

    // 2. Delete files from disk
    try {
        const fs = require('fs');
        const path = require('path');
        const publicPath = path.join(process.cwd(), "public");
        
        // Safety check: ensure path starts with /engines/ to avoid deleting other stuff
        if (engine.filePath && engine.filePath.startsWith("/engines/")) {
            const absoluteJsPath = path.join(publicPath, engine.filePath);
            const parentDir = path.dirname(absoluteJsPath);
            const baseName = path.basename(absoluteJsPath, ".js");

            // Delete .js
            if (fs.existsSync(absoluteJsPath)) fs.unlinkSync(absoluteJsPath);

            // Delete .wasm (all variants)
            // Strategy: read directory and delete files starting with baseName (files only)
            if (fs.existsSync(parentDir)) {
                const files = fs.readdirSync(parentDir);
                files.forEach((file: string) => {
                    // Check if file belongs to this engine (starts with same name and is wasm)
                    // Be careful not to delete other engines if they share prefix (unlikely with our import but possible)
                    // Our import uses specific folders, so usually safe.
                    // Strict match: logic to clear .wasm and -part-X.wasm
                    if (
                        (file === baseName + ".wasm") || 
                        (file.startsWith(baseName + "-part-") && file.endsWith(".wasm"))
                    ) {
                        fs.unlinkSync(path.join(parentDir, file));
                    }
                });

                // 3. Try cleaning empty directory
                const remaining = fs.readdirSync(parentDir);
                if (remaining.length === 0) {
                    fs.rmdirSync(parentDir);
                }
            }
        }
    } catch (err) {
        console.error("Error deleting engine files:", err);
        // Continue to delete from DB even if file delete fails
    }

    // 4. Delete from DB
    await prisma.engine.delete({
      where: { id: engineId },
    });

    return res.status(200).json({ message: "Engine deleted" });
  }

  return res.status(405).json({ message: "Method not allowed" });
}
