export const RESUME_PHOTO_INPUT_ACCEPT = "image/*,.heic,.heif";

type PreparedResumePhoto = {
  file: File;
  dataUrl: string;
};

type PrepareResumePhotoOptions = {
  maxBytes: number;
  maxDimension?: number;
};

const DEFAULT_MAX_DIMENSION = 900;
const JPEG_QUALITIES = [0.88, 0.8, 0.72, 0.64, 0.56, 0.48] as const;

function isImageLike(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("image/") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

function outputName(file: File): string {
  const base = file.name.replace(/\.[^.]+$/, "").trim() || "resume-photo";
  return `${base.replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/-+/g, "-")}.jpg`;
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image."));
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not prepare image."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unsupported image format."));
    };
    img.src = url;
  });
}

async function decodeImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  close?: () => void;
}> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall back to <img>; some mobile browsers expose images that
      // createImageBitmap cannot decode but regular image decoding can.
    }
  }

  const img = await loadImageElement(file);
  return {
    source: img,
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
  };
}

export async function prepareResumePhoto(
  file: File,
  options: PrepareResumePhotoOptions,
): Promise<PreparedResumePhoto> {
  if (!isImageLike(file)) {
    throw new Error("Choose a photo from your library or camera.");
  }

  const decoded = await decodeImage(file).catch(() => {
    throw new Error(
      "We could not read that photo. Try selecting it from your photo library again, or choose a JPEG/PNG portrait.",
    );
  });

  try {
    const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
    let width = decoded.width;
    let height = decoded.height;
    const initialScale = Math.min(1, maxDimension / Math.max(width, height));
    width = Math.max(1, Math.round(width * initialScale));
    height = Math.max(1, Math.round(height * initialScale));

    let bestBlob: Blob | null = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not prepare image.");
      ctx.drawImage(decoded.source, 0, 0, width, height);

      for (const quality of JPEG_QUALITIES) {
        const blob = await canvasToJpegBlob(canvas, quality);
        bestBlob = blob;
        if (blob.size <= options.maxBytes) {
          return {
            file: new File([blob], outputName(file), { type: "image/jpeg" }),
            dataUrl: await readBlobAsDataUrl(blob),
          };
        }
      }

      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
    }

    if (!bestBlob) throw new Error("Could not prepare image.");
    throw new Error("That photo is too large to use. Try a closer-cropped portrait.");
  } finally {
    decoded.close?.();
  }
}
