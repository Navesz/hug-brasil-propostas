"use client";

import { useLayoutEffect, useState } from "react";
import { PDF_PAGE_CONTENT_HEIGHT_PX } from "@/lib/pdfConstants";

const SECTION_GAP_PX = 24;
/** Reserva para o padding-top interno das páginas de conteúdo. */
const PAGE_PADDING_RESERVE_PX = 40;

/**
 * Agrupa blocos de seções em páginas A4.
 * Cada bloco é mantido inteiro na mesma página; se um bloco for maior que
 * uma página, ele é dividido seção a seção.
 */
export function packBlocksIntoPages(
  blocks: string[][],
  heights: Map<string, number>,
  maxPageHeight = PDF_PAGE_CONTENT_HEIGHT_PX - PAGE_PADDING_RESERVE_PX
): string[][] {
  const pages: string[][] = [];
  let currentPage: string[] = [];
  let currentHeight = 0;

  const heightOf = (ids: string[]): number =>
    ids.reduce(
      (sum, id, i) => sum + (heights.get(id) ?? 0) + (i > 0 ? SECTION_GAP_PX : 0),
      0
    );

  const place = (ids: string[]) => {
    const h = heightOf(ids);
    const gap = currentPage.length > 0 ? SECTION_GAP_PX : 0;
    if (currentPage.length > 0 && currentHeight + gap + h > maxPageHeight) {
      pages.push(currentPage);
      currentPage = [...ids];
      currentHeight = h;
    } else {
      currentPage.push(...ids);
      currentHeight += gap + h;
    }
  };

  for (const block of blocks) {
    if (block.length === 0) continue;
    if (block.length > 1 && heightOf(block) > maxPageHeight) {
      // Bloco maior que uma página: começa em página própria e
      // distribui as seções sem misturar com o conteúdo anterior.
      if (currentPage.length > 0) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }
      block.forEach((id) => place([id]));
    } else {
      place(block);
    }
  }

  if (currentPage.length > 0) pages.push(currentPage);
  return pages.length > 0 ? pages : [blocks.flat()];
}

export function useA4Pagination(
  measureRef: React.RefObject<HTMLElement | null>,
  blocks: string[][],
  enabled = true
): string[][] | null {
  const [pages, setPages] = useState<string[][] | null>(null);

  useLayoutEffect(() => {
    if (!enabled) {
      setPages(null);
      return;
    }

    const container = measureRef.current;
    if (!container) return;

    const sectionIds = blocks.flat();

    const measure = () => {
      const heights = new Map<string, number>();
      sectionIds.forEach((id) => {
        const el = container.querySelector(`[data-section-id="${id}"]`);
        if (el) heights.set(id, el.getBoundingClientRect().height);
      });
      setPages(packBlocksIntoPages(blocks, heights));
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measureRef, JSON.stringify(blocks), enabled]);

  return pages;
}
