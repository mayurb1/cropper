import { useCallback, useMemo, type RefObject } from "react";
import type { ImageEditorLabels, ExportImageFormat } from "../types";
import type { Viewport } from "../types";
import type { ExportOptions } from "../types";

export interface UseExportActionsParams {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  exportMime: ExportImageFormat;
  exportQuality: number;
  viewport: Viewport;
  onExport?:
    | ((
        blob: Blob,
        meta?: {
          width: number;
          height: number;
          mime: string;
          exportOptions?: ExportOptions;
        }
      ) => void)
    | undefined;
  showToast: (msg: string) => void;
  labels: ImageEditorLabels;
}

/**
 * Canvas → Blob export, download link, clipboard, and `onSave` / `onExport` wiring.
 */
export function useExportActions({
  canvasRef,
  exportMime,
  exportQuality,
  viewport,
  onExport,
  showToast,
  labels,
}: UseExportActionsParams) {
  const exportOptions = useMemo(
    () => ({ mime: exportMime, quality: exportQuality }),
    [exportMime, exportQuality]
  );

  const exportCanvasToBlob = useCallback((): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve(null);
    const q =
      exportMime === "image/png" ? undefined : exportQuality / 100;
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        exportMime,
        q
      );
    });
  }, [canvasRef, exportMime, exportQuality]);

  const onSave = useCallback(() => {
    void exportCanvasToBlob().then((blob) => {
      if (!blob) return;
      onExport?.(blob, {
        width: viewport.w,
        height: viewport.h,
        mime: exportMime,
        exportOptions,
      });
    });
  }, [exportCanvasToBlob, viewport, exportMime, exportOptions, onExport]);

  const onDownload = useCallback(() => {
    void exportCanvasToBlob().then((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      const ext =
        exportMime === "image/jpeg"
          ? "jpg"
          : exportMime.replace("image/", "");
      a.download = `image.${ext}`;
      a.click();
      URL.revokeObjectURL(href);
    });
  }, [exportCanvasToBlob, exportMime]);

  const onCopyClipboard = useCallback(() => {
    if (!navigator.clipboard?.write) return;
    void exportCanvasToBlob().then((blob) => {
      if (!blob) return;
      void navigator.clipboard
        .write([new ClipboardItem({ [blob.type]: blob })])
        .then(() => showToast(labels.copiedToClipboard ?? "Copied"))
        .catch(() => {
          /* clipboard may reject (permissions, unsupported type) */
        });
    });
  }, [exportCanvasToBlob, labels.copiedToClipboard, showToast]);

  return {
    exportOptions,
    exportCanvasToBlob,
    onSave,
    onDownload,
    onCopyClipboard,
  };
}
