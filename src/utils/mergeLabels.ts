import type { ImageEditorLabels } from "../types";
import { DEFAULT_LABELS } from "../constants";

/** Fully merged labels object (all keys from defaults, overrides from partial). */
export type ResolvedImageEditorLabels = typeof DEFAULT_LABELS;

/**
 * Merge user `labels` with defaults for a complete `ImageEditorLabels` shape.
 */
export function mergeImageEditorLabels(
  partial?: Partial<ImageEditorLabels>
): ResolvedImageEditorLabels {
  return { ...DEFAULT_LABELS, ...partial };
}
