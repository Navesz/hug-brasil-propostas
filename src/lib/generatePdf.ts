import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 8;

async function waitForCharts(ms = 400): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

function prepareCloneForExport(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = "absolute";
  clone.style.left = "-99999px";
  clone.style.top = "0";
  clone.style.width = "210mm";
  clone.style.maxWidth = "210mm";
  clone.style.maxHeight = "none";
  clone.style.height = "auto";
  clone.style.overflow = "visible";
  clone.style.boxShadow = "none";
  clone.classList.add("pdf-export-clone");
  document.body.appendChild(clone);
  return clone;
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

export async function generatePdfFromElement(
  element: HTMLElement,
  filename: string
): Promise<Blob> {
  const clone = prepareCloneForExport(element);
  await waitForCharts();

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: clone.scrollWidth,
      height: clone.scrollHeight,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidthMm = A4_WIDTH_MM - MARGIN_MM * 2;
    sliceCanvasToPages(canvas, pdf, imgWidthMm);
    pdf.save(filename);
    return pdf.output("blob");
  } finally {
    document.body.removeChild(clone);
  }
}

export async function sharePdfWhatsApp(
  element: HTMLElement,
  filename: string,
  message: string
): Promise<void> {
  const clone = prepareCloneForExport(element);
  await waitForCharts();

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      height: clone.scrollHeight,
    });

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgWidthMm = A4_WIDTH_MM - MARGIN_MM * 2;
    sliceCanvasToPages(canvas, pdf, imgWidthMm);
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
  } finally {
    document.body.removeChild(clone);
  }
}

export async function sendProposalEmail(
  element: HTMLElement,
  filename: string,
  data: { cliente: string; email: string; assunto: string }
): Promise<void> {
  const clone = prepareCloneForExport(element);
  await waitForCharts();

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      height: clone.scrollHeight,
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    sliceCanvasToPages(canvas, pdf, A4_WIDTH_MM - MARGIN_MM * 2);
    pdf.save(filename);
  } finally {
    document.body.removeChild(clone);
  }

  const body = encodeURIComponent(
    `Olá ${data.cliente},\n\nSegue em anexo a proposta comercial HUG BRASIL Energia Solar.\n\nAtenciosamente,\nHUG BRASIL`
  );
  const subject = encodeURIComponent(data.assunto);
  const mailto = data.email
    ? `mailto:${data.email}?subject=${subject}&body=${body}`
    : `mailto:?subject=${subject}&body=${body}`;
  window.location.href = mailto;
}
