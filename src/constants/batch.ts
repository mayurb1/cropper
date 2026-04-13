import type { ImageEditorBatchItem } from "../types";

/** Stable empty list when `batch` prop is omitted — avoids new `[]` each render. */
export const EMPTY_IMAGE_EDITOR_BATCH: readonly ImageEditorBatchItem[] = [];
