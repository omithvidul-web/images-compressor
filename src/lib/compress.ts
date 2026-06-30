export type CompressOptions = {
  quality: number; // 0..1
  maxDimension?: number; // optional downscale cap
  outputType?: "image/jpeg" | "image/webp";
};

export type CompressResult = {
  blob: Blob;
  url: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  savedPct: number;
  outputType: string;
  filename: string;
};

export async function compressImage(file: File, opts: CompressOptions): Promise<CompressResult> {
  const { quality, maxDimension, outputType = "image/jpeg" } = opts;

  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (maxDimension && Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unsupported");

  if (outputType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      outputType,
      Math.max(0.05, Math.min(1, quality)),
    );
  });

  const ext = outputType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");
  const filename = `${baseName}-compressed.${ext}`;
  const url = URL.createObjectURL(blob);
  const savedPct = Math.max(0, Math.round((1 - blob.size / file.size) * 100));

  return {
    blob,
    url,
    width,
    height,
    originalSize: file.size,
    compressedSize: blob.size,
    savedPct,
    outputType,
    filename,
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
