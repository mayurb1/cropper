import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { ImageEditorBatchItem } from "../types";
import { EMPTY_IMAGE_EDITOR_BATCH } from "../constants";

export interface UseImageEditorBatchResult {
  batchItems: readonly ImageEditorBatchItem[];
  /** Stable fingerprint of current batch list (name/size/mtime). */
  batchKey: string;
  batchPreviewEntries: { i: number; url: string; label: string }[];
  fileForUrl: File | null;
  batchIndex: number;
  setBatchIndex: Dispatch<SetStateAction<number>>;
}

/**
 * Stable batch list, preview object URLs, and derived `fileForUrl` for the active strip item.
 */
export function useImageEditorBatch(
  batch: ImageEditorBatchItem[] | undefined,
  file: File | null | undefined
): UseImageEditorBatchResult {
  const batchItems = useMemo(
    () => batch ?? EMPTY_IMAGE_EDITOR_BATCH,
    [batch]
  );

  const batchKey = useMemo(
    () =>
      batchItems
        .map((b) => `${b.file.name}-${b.file.size}-${b.file.lastModified}`)
        .join("|"),
    [batchItems]
  );

  const [batchPreviewEntries, setBatchPreviewEntries] = useState<
    { i: number; url: string; label: string }[]
  >([]);

  useEffect(() => {
    const entries = batchItems.map((item, i) => ({
      i,
      url: URL.createObjectURL(item.file),
      label: item.label ?? item.file.name,
    }));
    setBatchPreviewEntries(entries);
    return () => {
      entries.forEach((e) => URL.revokeObjectURL(e.url));
    };
  }, [batchKey, batchItems]);

  const [batchIndex, setBatchIndex] = useState(0);

  const fileForUrl =
    batchItems.length > 0
      ? batchItems[batchIndex]?.file ?? null
      : file ?? null;

  useEffect(() => {
    setBatchIndex((i) =>
      batchItems.length === 0 ? 0 : Math.min(i, batchItems.length - 1)
    );
  }, [batchItems.length]);

  return {
    batchItems,
    batchKey,
    batchPreviewEntries,
    fileForUrl,
    batchIndex,
    setBatchIndex,
  };
}
