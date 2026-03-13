import { promises as fs } from "fs";
import path from "path";
import { ENV } from "./_core/env";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Ensures the uploads directory exists
 */
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Saves a file to the local filesystem
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  await ensureUploadsDir();

  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(UPLOADS_DIR, key);
  const dirPath = path.dirname(filePath);

  // Ensure target subdirectory exists
  await fs.mkdir(dirPath, { recursive: true });

  await fs.writeFile(filePath, data);

  // URL should be relative to host for the client to resolve
  const url = `/uploads/${key}`;
  return { key, url };
}

/**
 * Gets a file URL (local path)
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  return {
    key,
    url: `/uploads/${key}`,
  };
}
