import type { FilterConfig } from "../types";

const DEFAULT_FILTER: FilterConfig = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  grayscale: 0,
  sepia: 0,
  blurPx: 0,
};

/**
 * Builds a CSS filter string for Canvas 2D `ctx.filter`.
 */
export function buildCanvasFilterString(config: FilterConfig): string {
  const c = { ...DEFAULT_FILTER, ...config };
  const parts: string[] = [];
  if (c.brightness !== 1) parts.push(`brightness(${c.brightness})`);
  if (c.contrast !== 1) parts.push(`contrast(${c.contrast})`);
  if (c.saturation !== 1) parts.push(`saturate(${c.saturation})`);
  if (c.grayscale > 0) parts.push(`grayscale(${c.grayscale})`);
  if (c.sepia > 0) parts.push(`sepia(${c.sepia})`);
  if (c.blurPx > 0) parts.push(`blur(${c.blurPx}px)`);
  return parts.length ? parts.join(" ") : "none";
}

export function isFilterDefault(config: FilterConfig): boolean {
  return (
    config.brightness === 1 &&
    config.contrast === 1 &&
    config.saturation === 1 &&
    config.grayscale === 0 &&
    config.sepia === 0 &&
    config.blurPx === 0
  );
}
