"use client";

import { createClient } from "./client";

const PROJECT_IMAGES_BUCKET = "project-images";


export async function uploadProjectImages(
  imageDataUrls: string[],
  userId: string
): Promise<string[]> {
  const supabase = createClient();
  const uploadedUrls: string[] = [];

  for (let i = 0; i < imageDataUrls.length; i++) {
    const dataUrl = imageDataUrls[i];

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      const fileExt = blob.type.split("/")[1] || "png";
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 9);
      const fileName = `${timestamp}-${random}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(PROJECT_IMAGES_BUCKET)
        .upload(filePath, blob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.warn("Error uploading image to storage, using data URL:", error);
        uploadedUrls.push(dataUrl);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(PROJECT_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      } else {
        uploadedUrls.push(dataUrl);
      }
    } catch (error) {
      console.warn("Error processing image, using data URL:", error);
      uploadedUrls.push(dataUrl);
    }
  }

  return uploadedUrls;
}

export async function deleteProjectImage(
  filePath: string
): Promise<{ error: any }> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .remove([filePath]);

  return { error };
}

export function getProjectImageUrl(filePath: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from(PROJECT_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

