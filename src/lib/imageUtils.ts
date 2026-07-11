const DEFAULT_MAX_SIZE = 800;
const DEFAULT_JPEG_QUALITY = 0.88;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = src;
  });
}

function isPngDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith("data:image/png");
}

/** Redimensiona e comprime uma data URL de imagem. PNG mantém transparência. */
export async function compressImageDataUrl(
  dataUrl: string,
  maxSize = DEFAULT_MAX_SIZE,
  quality = DEFAULT_JPEG_QUALITY
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

  const preservePng = isPngDataUrl(dataUrl);
  if (!preservePng) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  if (preservePng) {
    return canvas.toDataURL("image/png");
  }
  return canvas.toDataURL("image/jpeg", quality);
}

/** Comprime um arquivo de imagem antes do upload. */
export async function compressImageFile(
  file: File,
  maxSize = DEFAULT_MAX_SIZE,
  quality = DEFAULT_JPEG_QUALITY
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });

  try {
    return await compressImageDataUrl(dataUrl, maxSize, quality);
  } catch {
    // Se a compressão falhar (ex.: PNG especial), usa o arquivo original
    return dataUrl;
  }
}
