type OptimizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
};

/**
 * Redimensionne et compresse une image (JPG/PNG/WebP/AVIF) en WebP/JPG
 * côté client avant l'upload. Les SVG, GIF et autres formats sont renvoyés
 * tels quels.
 */
export async function optimizeImageFile(
  file: File,
  { maxWidth = 1920, maxHeight = 1920, quality = 0.82 }: OptimizeOptions = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const mime = canvas.toDataURL("image/webp").startsWith("data:image/webp")
      ? "image/webp"
      : "image/jpeg";

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, mime, quality)
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const extension = mime === "image/webp" ? ".webp" : ".jpg";
    return new File([blob], `${baseName}${extension}`, { type: mime });
  } catch {
    return file;
  }
}