import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import formidable from "formidable";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

// Disable Next.js body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Authentication Check
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ message: "Unauthorized" });

  const prisma = (await import("@/lib/prisma")).prisma;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });

  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  // Create upload directory if not exists
  const uploadDir = path.join(process.cwd(), "public", "temp_uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 200 * 1024 * 1024, // 200MB
  });

  try {
    const [, files] = await form.parse(req);
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const zipPath = uploadedFile.filepath;
    const zipName = uploadedFile.originalFilename?.replace(".zip", "") || "engine";
    
    // Read ZIP content
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    // Scan for engine pairs (.js + .wasm)
    const potentialEngines: any[] = [];
    const entriesMap = new Set(zipEntries.map((e) => e.entryName));

    // Debug logging to file
    const logPath = path.join(uploadDir, "debug_log.txt");
    const logContent = `Scanning ${zipName}:\n` + zipEntries.map(e => e.entryName).join("\n");
    fs.writeFileSync(logPath, logContent);
    console.log("Debug log written to", logPath);

    zipEntries.forEach((entry) => {
      // Relaxed check: just ends with .js
      if (entry.entryName.endsWith(".js")) {
        // Check if corresponding .wasm exists (REPLACE ONLY AT THE END)
        const wasmName = entry.entryName.replace(/\.js$/, ".wasm");
        let hasWasm = entriesMap.has(wasmName);
        let isMultiPart = false;

        if (!hasWasm) {
            // Check for multi-part wasm (e.g. stockfish-part-0.wasm)
            const part0Name = entry.entryName.replace(/\.js$/, "-part-0.wasm");
            if (entriesMap.has(part0Name)) {
                hasWasm = true;
                isMultiPart = true;
            }
        }

        // LOG
        fs.appendFileSync(logPath, `\nChecking: ${entry.entryName}\n   -> Looking for: ${wasmName} (or multi-part)\n   -> Found: ${hasWasm}`);
        
        // Also check if .wasm exists in the map
        if (hasWasm) {
            // Found a pair!
            const fileName = path.basename(entry.entryName);
            // Suggest a display name based on filename
            let suggestedName = fileName.replace(".js", "").replace(/[-_]/g, " ");
            // Suggest type
            let suggestedType = "standard";
            if (fileName.includes("lite")) suggestedType = "lite";
            if (fileName.includes("nnue")) suggestedType = "nnue";
            if (fileName.includes("single")) suggestedType = "single";

            potentialEngines.push({
                path: entry.entryName,
                name: suggestedName,
                type: suggestedType,
                fileName: fileName,
                isMultiPart: isMultiPart
            });
        }
      }
    });

    // Return the temp path and found engines
    // Note: We keep the file in temp_uploads, we will need it for the next step (Import)
    return res.status(200).json({ 
        tempPath: path.basename(zipPath), // Handle security: only send basename
        originalName: zipName,
        foundEngines: potentialEngines 
    });

  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Upload failed: " + (error as Error).message });
  }
}
