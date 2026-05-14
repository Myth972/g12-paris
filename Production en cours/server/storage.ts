import { promises as fs } from "fs";
import path from "path";
import { ENV } from "./_core/env.js";
import { put } from "@vercel/blob";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Ensures the uploads directory exists (local only)
 */
async function ensureUploadsDir() {
  if (ENV.blobToken) return; // Not needed for Vercel Blob
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Saves a file to the local filesystem or Vercel Blob
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");

  if (ENV.blobToken) {
    // Production / Cloud Storage
    const blobData = data instanceof Uint8Array ? Buffer.from(data) : data;
    const blob = await put(key, blobData, {
      access: "public",
      contentType,
      token: ENV.blobToken,
    });
    return { key: blob.pathname, url: blob.url };
  }

  // If we are on Vercel but blobToken is missing, we must NOT try to write to local FS
  if (process.env.VERCEL) {
    throw new Error(
      "Vercel Blob n'est pas configuré. Veuillez créer un Blob Store dans le dashboard Vercel et redéployer."
    );
  }

  // Local / Development Storage
  await ensureUploadsDir();
  const filePath = path.join(UPLOADS_DIR, key);
  const dirPath = path.dirname(filePath);

  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(filePath, data);

  const url = `/uploads/${key}`;
  return { key, url };
}

/**
 * Gets a file URL
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  // Note: For Vercel Blob, we expect the full URL to be stored in the DB during storagePut
  // This function is mainly for legacy local paths
  return {
    key,
    url: key.startsWith("http") ? key : `/uploads/${key}`,
  };
}
