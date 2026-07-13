import fs from "fs/promises";
import path from "path";

export class LocalMockStorageService {
  async uploadFile(buffer: Uint8Array | Buffer, filePath: string, mimeType: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), "public", "uploads", path.dirname(filePath));
    const fileName = path.basename(filePath);
    
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    const fullPath = path.join(uploadDir, fileName);
    await fs.writeFile(fullPath, buffer);
    
    // Normalize path for web URL
    const webPath = filePath.replace(/\\/g, "/");
    return `/uploads/${webPath}`;
  }
}
