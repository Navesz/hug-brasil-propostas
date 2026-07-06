import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 8;

const UNSUPPORTED_COLOR = /lab\(|oklch\(/i;

async function waitForCharts(ms = 400): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

function walkParallelInlineStyles(source: Element, target: Element): void {
  if (source instanceof HTMLElement && target instanceof HTMLElement) {
    const computed = window.getComputedStyle(source);
    for (let i = 0; i < computed.length; i++) {
      const prop = computed[i];
      const value = computed.getPropertyValue(prop);
      if (!value || UNSUPPORTED_COLOR.test(value)) continue;
      target.style.setProperty(prop, value, computed.getPropertyPriority(prop));
    }
  }

  const sourceChildren = source.children;
  const targetChildren = target.children;
  for (let i = 0; i < sourceChildren.length; i++) {
    if (targetChildren[i]) {
      walkParallelInlineStyles(sourceChildren[i], targetChildren[i]);
    }
  }
}

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
}

function prepareCloneForPdfExport(clonedElement: HTMLElement): void {
  clonedElement.style.maxWidth = "210mm";
  clonedElement.style.width = "210mm";
  clonedElement.style.maxHeight = "none";
  clonedElement.style.height = "auto";
  clonedElement.style.overflow = "visible";
  clonedElement.style.boxShadow = "none";
  clonedElement.classList.add("pdf-export-clone");
}

function stripUnsupportedColorStyles(clonedDoc: Document): void {
  clonedDoc.querySelectorAll("style").forEach((node) => {
    if (UNSUPPORTED_COLOR.test(node.textContent ?? "")) {
      node.remove();
    }
  });

  clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => {
    node.remove();
  });

  const reset = clonedDoc.createElement("style");
  reset.textContent = `
    .pdf-export-clone, .pdf-export-clone * {
      box-sizing: border-box;
    }
  `;
  clonedDoc.head.appendChild(reset);
}

function sliceCanvasToPages(
  canvas: HTMLCanvasElement,
  pdf: jsPDF,
  imgWidthMm: number
): void {
  const pageHeightMm = A4_HEIGHT_MM - MARGIN_MM * 2;
  const pageHeightPx = (canvas.height * pageHeightMm) / imgWidthMm;
  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvas.height) {
    const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const ctx = slice.getContext("2d");
    if (!ctx) break;

    ctx.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    const sliceHeightMm = (sliceHeight * imgWidthMm) / canvas.width;
    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(
      slice.toDataURL("image/png"),
      "PNG",
      MARGIN_MM,
      MARGIN_MM,
      imgWidthMm,
      sliceHeightMm
    );

    offsetY += sliceHeight;
    pageIndex++;
  }
}

async function captureElementToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  await waitForCharts();

  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    height: element.scrollHeight,
    windowHeight: element.scrollHeight,
    onclone: (clonedDoc, clonedElement) => {
      const cloneRoot = clonedElement as HTMLElement;
      prepareCloneForPdfExport(cloneRoot);
      walkParallelInlineStyles(element, cloneRoot);
      syncRechartsContent(element, cloneRoot);
      stripUnsupportedColorStyles(clonedDoc);
    },
  });
}

async function buildPdfFromElement(element: HTMLElement): Promise<jsPDF> {
  const canvas = await captureElementToCanvas(element);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  sliceCanvasToPages(canvas, pdf, A4_WIDTH_MM - MARGIN_MM * 2);
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

export async function sharePdfWhatsApp(
  element: HTMLElement,
  filename: string,
  message: string
): Promise<void> {
  const pdf = await buildPdfFromElement(element);
  const blob = pdf.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Proposta HUG BRASIL",
      text: message,
    });
    return;
  }

  pdf.save(filename);
  const text = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${text}`, "_blank");
}

export async function sendProposalEmail(
  element: HTMLElement,
  filename: string,
  data: { cliente: string; email: string; assunto: string }
): Promise<void> {
  const pdf = await buildPdfFromElement(element);
  pdf.save(filename);

  const body = encodeURIComponent(
    `Olá ${data.cliente},\n\nSegue em anexo a proposta comercial HUG BRASIL Energia Solar.\n\nAtenciosamente,\nHUG BRASIL`
  );
  const subject = encodeURIComponent(data.assunto);
  const mailto = data.email
    ? `mailto:${data.email}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;
  window.location.href = mailto;
}
