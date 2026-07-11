import { CROQUI_MAX_HEIGHT_PX } from "@/lib/constants";

const HUG_BLUE = "#0066b3";
const HUG_GREEN = "#2ecc71";
const SLATE_200 = "#e2e8f0";
const SLATE_50 = "#f8fafc";
const CHART_FONT =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** Aplica estilos inline seguros para html2canvas no clone do PDF. */
export function applyPdfSafeStyles(clone: HTMLElement): void {
  clone.querySelectorAll("[data-pdf-etapa-num]").forEach((node) => {
    const el = node as HTMLElement;
    el.style.display = "flex";
    el.style.alignItems = "center";
    el.style.justifyContent = "center";
    el.style.width = "40px";
    el.style.height = "40px";
    el.style.minWidth = "40px";
    el.style.minHeight = "40px";
    el.style.lineHeight = "normal";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = HUG_BLUE;
    el.style.color = "#ffffff";
    el.style.fontWeight = "700";
    el.style.fontSize = "14px";
    el.style.margin = "0 auto";
    el.style.textAlign = "center";
    el.style.padding = "0";
    el.style.boxSizing = "border-box";
  });

  clone.querySelectorAll("[data-pdf-kpi]").forEach((node) => {
    const el = node as HTMLElement;
    const variant = el.getAttribute("data-pdf-kpi");
    el.style.borderRadius = "12px";
    el.style.padding = "16px";
    el.style.textAlign = "center";
    el.style.boxSizing = "border-box";
    if (variant === "blue") {
      el.style.backgroundColor = "rgba(0, 102, 179, 0.1)";
      el.style.color = HUG_BLUE;
    } else {
      el.style.backgroundColor = "rgba(46, 204, 113, 0.1)";
      el.style.color = HUG_GREEN;
    }
  });

  clone.querySelectorAll("[data-pdf-border]").forEach((node) => {
    const el = node as HTMLElement;
    const width = el.getAttribute("data-pdf-border") || "1";
    el.style.border = `${width}px solid ${SLATE_200}`;
    el.style.borderRadius = "12px";
    el.style.boxSizing = "border-box";
  });

  clone.querySelectorAll("[data-pdf-bg-blue]").forEach((node) => {
    (node as HTMLElement).style.backgroundColor = "rgba(0, 102, 179, 0.05)";
  });

  clone.querySelectorAll("[data-pdf-bg-green]").forEach((node) => {
    (node as HTMLElement).style.backgroundColor = "rgba(46, 204, 113, 0.05)";
  });

  clone.querySelectorAll("[data-pdf-header]").forEach((node) => {
    const el = node as HTMLElement;
    el.style.background = `linear-gradient(to right, ${HUG_BLUE}, #1a6bb5)`;
    el.style.color = "#ffffff";
  });

  clone.querySelectorAll("[data-pdf-client-bar]").forEach((node) => {
    const el = node as HTMLElement;
    el.style.backgroundColor = SLATE_50;
    el.style.borderBottom = `4px solid ${HUG_GREEN}`;
  });

  clone.querySelectorAll("[data-pdf-footer]").forEach((node) => {
    (node as HTMLElement).style.backgroundColor = "#0f172a";
    (node as HTMLElement).style.color = "rgba(255,255,255,0.7)";
  });

  clone.querySelectorAll("[data-pdf-kit-header]").forEach((node) => {
    const el = node as HTMLElement;
    el.style.background = `linear-gradient(to right, rgba(0, 102, 179, 0.1), rgba(46, 204, 113, 0.1))`;
    el.style.padding = "12px 20px";
  });

  clone.querySelectorAll(".text-hug-blue, [class*='text-hug-blue']").forEach((node) => {
    (node as HTMLElement).style.color = HUG_BLUE;
  });

  clone.querySelectorAll(".text-hug-green, [class*='text-hug-green']").forEach((node) => {
    (node as HTMLElement).style.color = HUG_GREEN;
  });

  clone.querySelectorAll("[data-pdf-table-row]").forEach((node) => {
    const el = node as HTMLElement;
    el.style.borderBottom = "1px solid #94a3b8";
  });

  clone.querySelectorAll("[data-pdf-croqui-wrap]").forEach((node) => {
    const el = node as HTMLElement;
    el.style.width = "100%";
    el.style.overflow = "hidden";
    el.style.borderRadius = "6px";
  });

  clone.querySelectorAll("[data-pdf-croqui]").forEach((node) => {
    const el = node as HTMLElement;
    el.style.display = "block";
    el.style.width = "100%";
    el.style.maxWidth = "100%";
    el.style.height = "auto";
    el.style.maxHeight = `${CROQUI_MAX_HEIGHT_PX}px`;
    el.style.objectFit = "contain";
    el.style.borderRadius = "6px";
    el.style.boxSizing = "border-box";
  });

  clone.querySelectorAll(".pdf-page-label").forEach((node) => {
    (node as HTMLElement).style.display = "none";
  });

  // html2canvas pinta as linhas de grade dos gráficos em preto se a cor
  // não estiver explícita em cada elemento SVG.
  clone
    .querySelectorAll(".recharts-cartesian-grid line, .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line")
    .forEach((node) => {
      node.setAttribute("stroke", "#eef2f7");
      (node as SVGElement).style.stroke = "#eef2f7";
    });

  clone.querySelectorAll(".recharts-cartesian-axis line").forEach((node) => {
    node.setAttribute("stroke", "#cbd5e1");
    (node as SVGElement).style.stroke = "#cbd5e1";
  });

  // Tipografia explícita nos textos SVG dos gráficos (html2canvas não herda fonte).
  clone
    .querySelectorAll(
      ".recharts-wrapper text, .recharts-wrapper tspan, .recharts-legend-item-text"
    )
    .forEach((node) => {
      const el = node as SVGTextElement;
      el.setAttribute("font-family", CHART_FONT);
      if (!el.getAttribute("font-size")) {
        el.setAttribute("font-size", "11");
      }
      const fill = el.getAttribute("fill");
      if (!fill || fill === "currentColor" || fill === "#000" || fill === "#000000") {
        el.setAttribute("fill", "#64748b");
      }
    });
}
