import { useCallback, useState } from "react";
import { put } from "@vercel/blob/client";
import { trpc } from "@/lib/trpc";

type UploadProgress = {
  loaded: number;
  total: number;
  percentage: number;
};

type UploadResult = {
  url: string;
  key: string;
  pathname: string;
};

type UploadInput = {
  file: File;
  folder: string;
  onProgress?: (progress: UploadProgress) => void;
  makePathname?: (file: File) => string;
};

const MB = 1024 * 1024;

const sanitizeFolder = (folder: string) =>
  folder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");

const buildDefaultPathname = (folder: string, file: File) => {
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : "";
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${folder}/${suffix}${ext ? `.${ext}` : ""}`;
};

export function useBlobUpload() {
  const tokenMutation = trpc.uploads.generateUploadToken.useMutation();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const uploadFile = useCallback(
    async ({ file, folder, onProgress, makePathname }: UploadInput) => {
      if (!file) {
        throw new Error("Aucun fichier sélectionné.");
      }

      const safeFolder = sanitizeFolder(folder);
      if (!safeFolder) {
        throw new Error("Dossier de destination invalide.");
      }

      const pathname = makePathname
        ? makePathname(file)
        : buildDefaultPathname(safeFolder, file);

      setIsUploading(true);
      setProgress(null);
      try {
        try {
          const tokenResult = await tokenMutation.mutateAsync({
            pathname,
            contentType: file.type || undefined,
          });

          const result = await put(tokenResult.pathname, file, {
            access: "public",
            token: tokenResult.token,
            contentType: file.type || undefined,
            multipart: file.size > 5 * MB,
            onUploadProgress: info => {
              setProgress(info.percentage);
              onProgress?.(info);
            },
          });

          return {
            url: result.url,
            key: result.pathname,
            pathname: result.pathname,
          } as UploadResult;
        } catch (err: any) {
          // Fallback to local upload if Vercel Blob is not configured
          if (err.message?.includes("Vercel Blob n'est pas configuré") || err.message?.includes("token")) {
            console.log("Vercel Blob non configuré, tentative d'upload local...");
            
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
              };
              reader.onerror = error => reject(error);
            });

            const result = await trpc.uploads.localUpload.mutateAsync({
              base64,
              filename: file.name,
              folder: safeFolder,
              contentType: file.type,
            });

            return {
              url: result.url,
              key: result.key,
              pathname: result.key,
            } as UploadResult;
          }
          throw err;
        }
      } finally {
        setIsUploading(false);
      }
    },
    [tokenMutation]
  );

  return { uploadFile, isUploading, progress };
}
