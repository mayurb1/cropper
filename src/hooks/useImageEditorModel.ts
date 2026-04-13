/**
 * Model-layer hooks for {@link ImageEditor} (incrementally extracted for testability and reuse).
 * Batch queue + preview URLs; full editor orchestration remains in `ImageEditor.tsx` until further splits.
 */
export { useImageEditorBatch } from "./useImageEditorBatch";
export type { UseImageEditorBatchResult } from "./useImageEditorBatch";
