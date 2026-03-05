import { useCallback, useState } from "react";
import type { HistoryEntry } from "../types";

export function useEditorHistory(
  baseURL: string | null,
  imgSize: { width: number; height: number },
  setBaseURL: (url: string | null) => void,
  setImgSize: (size: { width: number; height: number }) => void
) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryEntry[]>([]);

  const pushHistory = useCallback((url: string, w: number, h: number) => {
    setHistory((hstack) => [...hstack, { dataURL: url, width: w, height: h }]);
    setRedoStack([]);
  }, []);

  const restoreEntry = useCallback(
    (entry: HistoryEntry) => {
      setBaseURL(entry.dataURL);
      setImgSize({ width: entry.width, height: entry.height });
    },
    [setBaseURL, setImgSize]
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setRedoStack((r) => [
        ...r,
        { dataURL: baseURL ?? "", width: imgSize.width, height: imgSize.height },
      ]);
      restoreEntry(prev);
      return h.slice(0, -1);
    });
  }, [baseURL, imgSize, restoreEntry]);

  const redoAction = useCallback(() => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const next = r[0];
      setHistory((h) => [
        ...h,
        { dataURL: baseURL ?? "", width: imgSize.width, height: imgSize.height },
      ]);
      restoreEntry(next);
      return r.slice(1);
    });
  }, [baseURL, imgSize, restoreEntry]);

  const cancelToFirst = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const first = h[0];
      restoreEntry(first);
      return [];
    });
    setRedoStack([]);
  }, [restoreEntry]);

  return {
    history,
    redoStack,
    pushHistory,
    undo,
    redoAction,
    cancelToFirst,
    setHistory,
    setRedoStack,
  };
}
