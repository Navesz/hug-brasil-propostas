import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  PDF_CAPTURE_SCALE,
  PDF_JPEG_QUALITY,
  PDF_MARGIN_MM,
} from "@/lib/pdfConstants";
import { applyPdfSafeStyles } from "@/lib/pdfStyles";

/** Hint de interpolação de gradientes ("in oklab") que o html2canvas não parseia. */
const INTERPOLATION_HINT =
  /\s+in\s+(?:oklab|oklch|srgb|srgb-linear|display-p3|hsl|hwb|lab|lch|xyz(?:-d(?:50|65))?)\b/gi;

async function waitForCharts(ms = 400): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Copia os estilos computados do documento real para inline styles no clone.
 * As stylesheets do Tailwind são removidas do clone (quebram o parser do
 * html2canvas), então cada elemento precisa carregar seu estilo completo.
 */
function inlineComputedStyles(source: HTMLElement, target: HTMLElement): void {
  const sourceEls = [source, ...Array.from(source.querySelectorAll("*"))];
  const targetEls = [target, ...Array.from(target.querySelectorAll("*"))];
  const len = Math.min(sourceEls.length, targetEls.length);

  for (let i = 0; i < len; i++) {
    const s = sourceEls[i];
    const t = targetEls[i];
    if (!(s instanceof HTMLElement) || !(t instanceof HTMLElement)) continue;

    const computed = window.getComputedStyle(s);
    for (let j = 0; j < computed.length; j++) {
      const prop = computed[j];
      let value = computed.getPropertyValue(prop);
      if (!value) continue;
      if (value.includes(" in ")) {
        value = value.replace(INTERPOLATION_HINT, "");
      }
      t.style.setProperty(prop, value, computed.getPropertyPriority(prop));
    }
  }
}

const CHART_FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function syncRechartsContent(source: Element, target: Element): void {
  const sourceWrappers = source.querySelectorAll(".recharts-wrapper");
  const targetWrappers = target.querySelectorAll(".recharts-wrapper");

  sourceWrappers.forEach((wrapper, index) => {
    const targetWrapper = targetWrappers[index];
    if (!(wrapper instanceof HTMLElement) || !(targetWrapper instanceof HTMLElement)) {
      return;
    }

    targetWrapper.innerHTML = wrapper.innerHTML;
    const computed = window.getComputedStyle(wrapper);
    targetWrapper.style.width = computed.width;
    targetWrapper.style.height = computed.height;
  });

  const sourceTexts = source.querySelectorAll(
    ".recharts-wrapper text, .recharts-wrapper tspan"
  );
  const targetTexts = target.querySelectorAll(
    ".recharts-wrapper text, .recharts-wrapper tspan"
  );

  targetTexts.forEach((node, index) => {
    const sourceNode = sourceTexts[index];
    const el = node as SVGTextElement;
    el.setAttribute("font-family", CHART_FONT);

    if (sourceNode instanceof SVGTextElement) {
      for (const attr of [
        "font-size",
        "fill",
        "font-weight",
        "dx",
        "dy",
        "x",
        "y",
        "text-anchor",
      ]) {
        const val = sourceNode.getAttribute(attr);
        if (val) el.setAttribute(attr, val);
      }
    } else {
      el.setAttribute("font-size", "11");
      el.setAttribute("fill", "#64748b");
    }
  });
}

function prepareCloneForPdfExport(clonedElement: HTMLElement): void {
  clonedElement.style.maxWidth = `${A4_WIDTH_MM}mm`;
  clonedElement.style.width = `${A4_WIDTH_MM}mm`;
  clonedElement.style.maxHeight = "none";
  clonedElement.style.height = "auto";
  clonedElement.style.overflow = "visible";
  clonedElement.style.boxShadow = "none";
  clonedElement.classList.add("pdf-export-clone");
}

function stripStylesheetsAndInjectFixes(clonedDoc: Document): void {
  clonedDoc.querySelectorAll("style").forEach((node) => node.remove());
  clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    node.remove();
  });

  const style = clonedDoc.createElement("style");
  // line-height normal centraliza o texto nos blocos de destaque
  // (html2canvas desloca o texto para baixo dentro do line box).
  style.textContent = `
    .pdf-export-clone, .pdf-export-clone * {
      box-sizing: border-box;
    }
    .pdf-export-clone .pdf-page {
      box-shadow: none !important;
      margin: 0 !important;
    }
    .pdf-export-clone .pdf-page-label {
      display: none !important;
    }
    .pdf-export-clone [data-pdf-etapa-num],
    .pdf-export-clone [data-pdf-kpi] p,
    .pdf-export-clone [data-pdf-bg-blue] p {
      line-height: normal !important;
    }
    .pdf-export-clone [data-pdf-logo-wrap] {
      flex-shrink: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 80px !important;
      max-width: 80px !important;
      height: 80px !important;
      max-height: 80px !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }
    .pdf-export-clone [data-pdf-logo] {
      display: block !important;
      width: auto !important;
      height: auto !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
    }
  `;
  clonedDoc.head.appendChild(style);
}

async function captureElementToCanvas(
  element: HTMLElement
): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: PDF_CAPTURE_SCALE,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: element.offsetWidth,
    height: element.offsetHeight,
    windowWidth: element.offsetWidth,
    windowHeight: element.offsetHeight,
    onclone: (clonedDoc, clonedElement) => {
      const cloneRoot = clonedElement as HTMLElement;
      prepareCloneForPdfExport(cloneRoot);
      inlineComputedStyles(element, cloneRoot);
      syncRechartsContent(element, cloneRoot);
      applyPdfSafeStyles(cloneRoot);
      stripStylesheetsAndInjectFixes(clonedDoc);
    },
  });
}

async function buildPdfFromElement(element: HTMLElement): Promise<jsPDF> {
  await waitForCharts();

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const pageElements = element.querySelectorAll(".pdf-page");
  const pages =
    pageElements.length > 0
      ? Array.from(pageElements)
      : [element];

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i] as HTMLElement;
    const canvas = await captureElementToCanvas(pageEl);

    if (i > 0) pdf.addPage();

    const imgWidthMm = A4_WIDTH_MM;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
    const drawHeight = Math.min(imgHeightMm, A4_HEIGHT_MM);

    pdf.addImage(
      canvas.toDataURL("image/jpeg", PDF_JPEG_QUALITY),
      "JPEG",
      0,
      0,
      imgWidthMm,
      drawHeight
    );
  }

  return pdf;
}

export async function generatePdfFromElement(
  element: HTMLElement,
  filename: string
): Promise<Blob> {
  const pdf = await buildPdfFromElement(element);
  pdf.save(filename);
  return pdf.output("blob");
}

export { A4_WIDTH_MM, A4_HEIGHT_MM, PDF_MARGIN_MM };
