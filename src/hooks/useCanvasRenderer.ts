import { useCallback, useLayoutEffect, useRef } from "react";
import type { CropRect } from "../types";
import type { Viewport } from "../types";
import { CROP_HANDLE_SIZE } from "../constants";
import { drawImageTransformed } from "../utils/canvas";
export interface UseCanvasRendererParams {
  loadedImg: HTMLImageElement | null;
  viewport: Viewport;
  rotation: number;
  flip: { x: boolean; y: boolean };
  cropRect: CropRect | null;
  /** Resolved theme name for crop overlay colors */
  resolvedTheme: "light" | "dark";
  filterStr: string;
  /** When true (e.g. fixed aspect crop), draw corner handles only */
  cornersOnlyCropHandles?: boolean;
}

/**
 * Manages preview canvas ref, draw pipeline (image + crop overlay), and layout-driven redraw.
 */
export function useCanvasRenderer({
  loadedImg,
  viewport,
  rotation,
  flip,
  cropRect,
  resolvedTheme,
  filterStr,
  cornersOnlyCropHandles = false,
}: UseCanvasRendererParams) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImg) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h, scale } = viewport;

    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    const imgW = loadedImg.naturalWidth || loadedImg.width;
    const imgH = loadedImg.naturalHeight || loadedImg.height;
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const ox = (w - drawW) / 2;
    const oy = (h - drawH) / 2;

    drawImageTransformed(
      ctx,
      loadedImg,
      w,
      h,
      ox,
      oy,
      drawW,
      drawH,
      rotation,
      flip.x,
      flip.y,
      filterStr
    );

    if (cropRect && (cropRect.width !== 0 || cropRect.height !== 0)) {
      const drawX = Math.min(cropRect.x, cropRect.x + cropRect.width);
      const drawY = Math.min(cropRect.y, cropRect.y + cropRect.height);
      const drawWc = Math.abs(cropRect.width);
      const drawHc = Math.abs(cropRect.height);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.rect(drawX, drawY, drawWc, drawHc);
      ctx.fill("evenodd");
      ctx.strokeStyle = resolvedTheme === "dark" ? "#5ca6ff" : "#1a84ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(drawX, drawY, drawWc, drawHc);
      ctx.setLineDash([]);
      const handleColor = resolvedTheme === "dark" ? "#5ca6ff" : "#1a84ff";
      const hs = CROP_HANDLE_SIZE / 2;
      const handles: [number, number][] = [
        [drawX, drawY],
        [drawX + drawWc, drawY],
        [drawX + drawWc, drawY + drawHc],
        [drawX, drawY + drawHc],
        [drawX + drawWc / 2, drawY],
        [drawX + drawWc, drawY + drawHc / 2],
        [drawX + drawWc / 2, drawY + drawHc],
        [drawX, drawY + drawHc / 2],
      ];
      const handlesToDraw = cornersOnlyCropHandles
        ? handles.slice(0, 4)
        : handles;
      ctx.fillStyle = handleColor;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      for (const [hx, hy] of handlesToDraw) {
        ctx.fillRect(hx - hs, hy - hs, CROP_HANDLE_SIZE, CROP_HANDLE_SIZE);
        ctx.strokeRect(hx - hs, hy - hs, CROP_HANDLE_SIZE, CROP_HANDLE_SIZE);
      }
    }
  }, [
    loadedImg,
    viewport,
    rotation,
    flip,
    cropRect,
    resolvedTheme,
    filterStr,
    cornersOnlyCropHandles,
  ]);

  useLayoutEffect(() => {
    redraw();
  }, [redraw]);

  return { canvasRef, redraw };
}
