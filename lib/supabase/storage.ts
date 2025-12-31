"use client";

import { createClient } from "./client";

const PROJECT_FILES_BUCKET = "project-files";

export interface FileUploadResult {
  dataUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function uploadProjectFiles(
  fileDataUrls: string[],
  fileNames: string[],
  fileTypes: string[],
  fileSizes: number[],
  userId: string
): Promise<string[]> {
  const supabase = createClient();
  const uploadedUrls: string[] = [];

  for (let i = 0; i < fileDataUrls.length; i++) {
    const dataUrl = fileDataUrls[i];
    const originalFileName = fileNames[i] || `file-${i}`;
    const fileType = fileTypes[i] || "application/octet-stream";

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const fileExt = originalFileName.split(".").pop() || 
                     fileType.split("/")[1] || 
                     "bin";
      
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const fileName = `${timestamp}-${random}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(PROJECT_FILES_BUCKET)
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.warn("Error uploading file to storage, using data URL:", error);
        uploadedUrls.push(dataUrl);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(PROJECT_FILES_BUCKET)
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      } else {
        uploadedUrls.push(dataUrl);
      }
    } catch (error) {
      console.warn("Error processing file, using data URL:", error);
      uploadedUrls.push(dataUrl);
    }
  }

  return uploadedUrls;
}

export async function deleteProjectFile(
  filePath: string
): Promise<{ error: any }> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .remove([filePath]);

  return { error };
}

export function getProjectFileUrl(filePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(PROJECT_FILES_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function uploadProjectImages(
  imageDataUrls: string[],
  userId: string
): Promise<string[]> {
  const fileNames = imageDataUrls.map((_, i) => `image-${i}.png`);
  const fileTypes = imageDataUrls.map(() => "image/png");
  const fileSizes = imageDataUrls.map(() => 0);
  return uploadProjectFiles(imageDataUrls, fileNames, fileTypes, fileSizes, userId);
}

