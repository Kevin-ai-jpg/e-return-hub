const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ParsedChatImage = {
  base64: string;
  mediaType: string;
  previewUrl: string;
  fileName: string;
};

export function validateChatImageFile(file: File): void {
  const mediaType = file.type || "image/jpeg";
  if (!ALLOWED_TYPES.has(mediaType)) {
    throw new Error("INVALID_TYPE");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("TOO_LARGE");
  }
}

export async function readChatImageFile(file: File): Promise<ParsedChatImage> {
  validateChatImageFile(file);
  const mediaType = file.type || "image/jpeg";

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("READ_FAILED"));
    reader.readAsDataURL(file);
  });

  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  if (!base64) throw new Error("READ_FAILED");

  return { base64, mediaType, previewUrl: dataUrl, fileName: file.name };
}
