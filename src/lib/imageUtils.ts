const DEFAULT_MAX_SIZE = 400;
const DEFAULT_QUALITY = 0.82;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number): string {
  return canvas.toDataURL("image/jpeg", quality);
}

/** Redimensiona e comprime uma data URL de imagem. */
export async function compressImageDataUrl(
  dataUrl: string,
  maxSize = DEFAULT_MAX_SIZE,
  quality = DEFAULT_QUALITY
): Promise<string> {
  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, width, height);
  return canvasToDataUrl(canvas, quality);
}

/** Comprime um arquivo de imagem antes do upload. */
export async function compressImageFile(
  file: File,
  maxSize = DEFAULT_MAX_SIZE,
  quality = DEFAULT_QUALITY
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return compressImageDataUrl(dataUrl, maxSize, quality);
}
