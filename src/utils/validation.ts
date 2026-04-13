/** Min/max for dimension inputs (px). */
export const DIMENSION_MIN = 1;
export const DIMENSION_MAX = 20000;

export interface DimensionValidation {
  valid: boolean;
  message?: string;
}

/**
 * Validates a single dimension in pixels.
 */
export function validateDimension(value: number): DimensionValidation {
  if (!Number.isFinite(value)) {
    return { valid: false, message: "Must be a number" };
  }
  if (value < DIMENSION_MIN) {
    return {
      valid: false,
      message: `Must be at least ${DIMENSION_MIN}px`,
    };
  }
  if (value > DIMENSION_MAX) {
    return {
      valid: false,
      message: `Must be at most ${DIMENSION_MAX}px`,
    };
  }
  return { valid: true };
}

/**
 * Returns a user-facing upscale warning when target dimensions exceed original.
 */
export function getUpscaleWarning(
  targetW: number,
  targetH: number,
  originalW: number,
  originalH: number
): string | undefined {
  if (originalW <= 0 || originalH <= 0) return undefined;
  if (targetW > originalW || targetH > originalH) {
    return "Upscaling may reduce quality";
  }
  return undefined;
}

/**
 * Formats a before → after dimension preview with percent change.
 */
export function formatResizePreview(
  fromW: number,
  fromH: number,
  toW: number,
  toH: number
): string {
  if (fromW <= 0 || fromH <= 0) return "";
  const pctW = Math.round(((toW - fromW) / fromW) * 100);
  const signW = pctW > 0 ? "+" : "";
  return `${fromW}px × ${fromH}px → ${toW}px × ${toH}px (${signW}${pctW}% width)`;
}

/**
 * Estimates uncompressed RGB output size in KB (rough).
 */
export function estimateRgbSizeKb(width: number, height: number): number {
  if (width < 1 || height < 1) return 0;
  return Math.round((width * height * 3) / 1024);
}
