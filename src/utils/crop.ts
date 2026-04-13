import type { CropRect } from "../types";
import type { Viewport } from "../types";

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function clampRectToViewport(
  rect: { x: number; y: number; width: number; height: number },
  viewport: Viewport,
): CropRect {
  const width = clamp(rect.width, 10, viewport.w);
  const height = clamp(rect.height, 10, viewport.h);
  const x = clamp(rect.x, 0, viewport.w - width);
  const y = clamp(rect.y, 0, viewport.h - height);
  return { x, y, width, height };
}

export function normalizeFromPoints(
  sx: number,
  sy: number,
  px: number,
  py: number,
  aspect?: number,
): CropRect {
  let w = Math.abs(px - sx);
  let h = Math.abs(py - sy);
  if (aspect && aspect > 0) {
    if (w / (h || 1) > aspect) h = w / aspect;
    else w = h * aspect;
  }
  const x = px >= sx ? sx : sx - w;
  const y = py >= sy ? sy : sy - h;
  return { x, y, width: w, height: h };
}

export function getCropRectNormalized(
  cropRect: CropRect | null,
): CropRect | null {
  if (!cropRect || (cropRect.width === 0 && cropRect.height === 0)) return null;
  const x = Math.min(cropRect.x, cropRect.x + cropRect.width);
  const y = Math.min(cropRect.y, cropRect.y + cropRect.height);
  const width = Math.abs(cropRect.width);
  const height = Math.abs(cropRect.height);
  return { x, y, width, height };
}

export type CropHandle =
  | "nw"
  | "ne"
  | "se"
  | "sw"
  | "n"
  | "e"
  | "s"
  | "w"
  | "center";

export function hitTestCropHandle(
  px: number,
  py: number,
  cropRect: CropRect | null,
  handleSize: number,
  includeEdgeHandles = true,
): CropHandle | null {
  const r = getCropRectNormalized(cropRect);
  if (!r) return null;
  const half = handleSize / 2;
  const { x, y, width, height } = r;
  const corners: [CropHandle, number, number][] = [
    ["nw", x, y],
    ["ne", x + width, y],
    ["se", x + width, y + height],
    ["sw", x, y + height],
  ];
  for (const [handle, hx, hy] of corners) {
    if (
      px >= hx - half &&
      px <= hx + half &&
      py >= hy - half &&
      py <= hy + half
    )
      return handle;
  }
  if (includeEdgeHandles) {
    if (
      py >= y - half &&
      py <= y + half &&
      px >= x + half &&
      px <= x + width - half
    )
      return "n";
    if (
      px >= x + width - half &&
      px <= x + width + half &&
      py >= y + half &&
      py <= y + height - half
    )
      return "e";
    if (
      py >= y + height - half &&
      py <= y + height + half &&
      px >= x + half &&
      px <= x + width - half
    )
      return "s";
    if (
      px >= x - half &&
      px <= x + half &&
      py >= y + half &&
      py <= y + height - half
    )
      return "w";
  }
  if (px >= x && px <= x + width && py >= y && py <= y + height)
    return "center";
  return null;
}

export function resizeCropRectFromHandle(
  handle: CropHandle,
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number,
  posX: number,
  posY: number,
  aspect: number | undefined,
  viewport: Viewport,
): CropRect | null {
  let x: number, y: number, w: number, h: number;
  switch (handle) {
    case "se":
      x = drawX;
      y = drawY;
      w = posX - drawX;
      h = posY - drawY;
      break;
    case "sw":
      x = posX;
      y = drawY;
      w = drawX + drawW - posX;
      h = posY - drawY;
      break;
    case "nw":
      x = posX;
      y = posY;
      w = drawX + drawW - posX;
      h = drawY + drawH - posY;
      break;
    case "ne":
      x = drawX;
      y = posY;
      w = posX - drawX;
      h = drawY + drawH - posY;
      break;
    case "n":
      x = drawX;
      y = posY;
      w = drawW;
      h = drawY + drawH - posY;
      break;
    case "s":
      x = drawX;
      y = drawY;
      w = drawW;
      h = posY - drawY;
      break;
    case "e":
      x = drawX;
      y = drawY;
      w = posX - drawX;
      h = drawH;
      break;
    case "w":
      x = posX;
      y = drawY;
      w = drawX + drawW - posX;
      h = drawH;
      break;
    default:
      return null;
  }
  if (handle === "n" || handle === "s") {
    if (h < 0) {
      y = handle === "n" ? drawY + drawH : drawY + h;
      h = Math.abs(h);
    }
  } else if (handle === "e" || handle === "w") {
    if (w < 0) {
      x = handle === "w" ? drawX + drawW : drawX + w;
      w = Math.abs(w);
    }
  } else {
    x = Math.min(x, x + w);
    y = Math.min(y, y + h);
    w = Math.abs(w);
    h = Math.abs(h);
  }
  if (handle !== "n" && handle !== "s" && handle !== "e" && handle !== "w") {
    w = Math.abs(w);
    h = Math.abs(h);
  }
  if (aspect && aspect > 0) {
    if (w / (h || 1) > aspect) h = w / aspect;
    else w = h * aspect;
    switch (handle) {
      case "se":
        break;
      case "sw":
        x = drawX + drawW - w;
        break;
      case "nw":
        x = drawX + drawW - w;
        y = drawY + drawH - h;
        break;
      case "ne":
        y = drawY + drawH - h;
        break;
      case "n":
        y = drawY + drawH - h;
        break;
      case "s":
        break;
      case "e":
        break;
      case "w":
        x = drawX + drawW - w;
        break;
    }
  }
  return clampRectToViewport({ x, y, width: w, height: h }, viewport);
}
