import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "Unauthorized" });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

  const { tempPath, originalName, engines, globalVersion } = req.body;

  if (!tempPath || !engines || !engines.length || !globalVersion) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const uploadDir = path.join(process.cwd(), "public", "temp_uploads");
  const zipFilePath = path.join(uploadDir, path.basename(tempPath));

  if (!fs.existsSync(zipFilePath)) {
    return res.status(404).json({ message: "Temporary file expired or not found" });
  }

  try {
    const zip = new AdmZip(zipFilePath);
    
    // Create destination folder: public/engines/[originalName]
    // Clean originalName to be safe
    const folderName = originalName.replace(/[^a-z0-9\-_.]/gi, "_").toLowerCase();
    const destDir = path.join(process.cwd(), "public", "engines", folderName);
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const createdEngines = [];

    // Process each selected engine
    for (const engine of engines) {
      if (!engine.selected) continue;

      // Extract JS and WASM
      const jsEntry = zip.getEntry(engine.path);
      
      // Standard WASM
      let wasmEntries = [zip.getEntry(engine.path.replace(/\.js$/, ".wasm"))].filter(Boolean);
      
      // If no standard WASM, check for multi-parts
      if (wasmEntries.length === 0) {
        // Simple search for parts
        let partIndex = 0;
        while (true) {
            const partName = engine.path.replace(/\.js$/, `-part-${partIndex}.wasm`);
            const entry = zip.getEntry(partName);
            if (!entry) break;
            wasmEntries.push(entry);
            partIndex++;
        }
      }

      if (jsEntry && wasmEntries.length > 0) {
        // We write them to the root of the new folder to keep it clean, 
        // flattening the structure from the zip
        const jsName = path.basename(engine.path);
        
        fs.writeFileSync(path.join(destDir, jsName), jsEntry.getData());
        
        // Write all WASM parts
        for (const we of wasmEntries) {
            // @ts-ignore
            const wName = path.basename(we.entryName);
            // @ts-ignore
            fs.writeFileSync(path.join(destDir, wName), we.getData());
        }

        // Create DB Entry
        // Logic: stockfish_{version}_{type}
        // distinct from filename to avoid weird naming
        const cleanVersion = globalVersion.replace(/[^0-9a-z]/gi, "_").toLowerCase();
        const identifierBase = `stockfish_${cleanVersion}_${engine.type}`;
        let identifier = identifierBase;
        
        // Handle multipart/special cases if needed?
        // Actually, let's keep it simple. If it exists, we stick to the update logic below.
        // But we need to use this new identifier for the check.
        
        // Check if exists
        const existing = await prisma.engine.findUnique({ where: { identifier } });
        
        if (existing && existing.filePath === `/engines/${folderName}/${jsName}`) {
            // Same file, same ID -> UPDATE (reactivate/update info)
            await prisma.engine.update({
                where: { id: existing.id },
                data: {
                    name: engine.name,
                    version: globalVersion,
                    type: engine.type,
                    isActive: true,
                    updatedAt: new Date()
                }
            });
            createdEngines.push(existing);
        } else {
            // New engine or conflict
            let finalIdentifier = identifier;
            if (existing) {
                // Conflict: same ID (version/type) but different file path -> weird but handle it
                // Maybe append a short hash or keep the old timestamp behavior for true conflict?
                // User wants clean IDs. If standard stockfish 17.1 is already there, and we import another file as 17.1...
                // Ideally this shouldn't happen often if versions are correct.
                // Let's allow specific differentiation if needed, but try to avoid long timestamp.
                // Maybe increment? _v2
                // Let's simple use random suffix for true conflict
                 finalIdentifier = `${identifier}_${Math.random().toString(36).substring(2, 7)}`;
            }

            const newEngine = await prisma.engine.create({
              data: {
                name: engine.name,
                identifier: finalIdentifier, // Use the clean identifier
                version: globalVersion,
                type: engine.type,
                filePath: `/engines/${folderName}/${jsName}`,
                isActive: true,
                isDefault: false
              }
            });
            createdEngines.push(newEngine);
        }
      }
    }

    // Cleanup temp zip
    try {
        fs.unlinkSync(zipFilePath);
    } catch (e) {
        console.warn("Could not delete temp file", e);
    }

    return res.status(200).json({ message: "Success", created: createdEngines.length });

  } catch (error) {
    console.error("Import error:", error);
    return res.status(500).json({ message: "Import failed: " + (error as Error).message });
  }
}
