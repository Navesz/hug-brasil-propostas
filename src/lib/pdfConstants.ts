export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const PDF_MARGIN_MM = 0;
export const PDF_CONTENT_WIDTH_MM = A4_WIDTH_MM - PDF_MARGIN_MM * 2;
export const PDF_CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PDF_MARGIN_MM * 2;

/** Converte milímetros em pixels CSS (96 DPI). */
export function mmToPx(mm: number): number {
  return mm * (96 / 25.4);
}

export const PDF_PAGE_CONTENT_HEIGHT_PX = mmToPx(PDF_CONTENT_HEIGHT_MM);
export const PDF_PAGE_WIDTH_PX = mmToPx(A4_WIDTH_MM);

/** Escala do html2canvas na exportação. */
export const PDF_CAPTURE_SCALE = 3;

/** Qualidade JPEG do PDF (0–1). */
export const PDF_JPEG_QUALITY = 1;
