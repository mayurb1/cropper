import { useCallback, useState } from "react";
import type { HistoryEntry } from "../types";

interface HistoryStacks {
  history: HistoryEntry[];
  redoStack: HistoryEntry[];
}

/**
 * Undo/redo stacks updated atomically (single state) so we never nest setState.
 * `restoreEntry` runs once after each mutating action, outside the state updater.
 */
export function useEditorHistory(
  baseURL: string | null,
  imgSize: { width: number; height: number },
  setBaseURL: (url: string | null) => void,
  setImgSize: (size: { width: number; height: number }) => void
) {
  const [stacks, setStacks] = useState<HistoryStacks>({
    history: [],
    redoStack: [],
  });

  const { history, redoStack } = stacks;

  const restoreEntry = useCallback(
    (entry: HistoryEntry) => {
      setBaseURL(entry.dataURL);
      setImgSize({ width: entry.width, height: entry.height });
    },
    [setBaseURL, setImgSize]
  );

  const pushHistory = useCallback(
    (url: string, w: number, h: number, label?: string) => {
      setStacks((s) => ({
        history: [
          ...s.history,
          { dataURL: url, width: w, height: h, label },
        ],
        redoStack: [],
      }));
    },
    []
  );

  const undo = useCallback(() => {
    let prev: HistoryEntry | null = null;
    setStacks((s) => {
      if (s.history.length === 0) return s;
      prev = s.history[s.history.length - 1];
      const currentSnap: HistoryEntry = {
        dataURL: baseURL ?? "",
        width: imgSize.width,
        height: imgSize.height,
      };
      return {
        history: s.history.slice(0, -1),
        redoStack: [...s.redoStack, currentSnap],
      };
    });
    if (prev) restoreEntry(prev);
  }, [baseURL, imgSize, restoreEntry]);

  const redoAction = useCallback(() => {
    let next: HistoryEntry | null = null;
    setStacks((s) => {
      if (s.redoStack.length === 0) return s;
      next = s.redoStack[s.redoStack.length - 1];
      const currentSnap: HistoryEntry = {
        dataURL: baseURL ?? "",
        width: imgSize.width,
        height: imgSize.height,
      };
      return {
        history: [...s.history, currentSnap],
        redoStack: s.redoStack.slice(0, -1),
      };
    });
    if (next) restoreEntry(next);
  }, [baseURL, imgSize, restoreEntry]);

  const cancelToFirst = useCallback(() => {
    let first: HistoryEntry | null = null;
    setStacks((s) => {
      if (s.history.length === 0) return s;
      first = s.history[0];
      return { history: [], redoStack: [] };
    });
    if (first) restoreEntry(first);
  }, [restoreEntry]);

  const jumpToHistory = useCallback(
    (index: number) => {
      let target: HistoryEntry | null = null;
      setStacks((s) => {
        if (index < 0 || index >= s.history.length) return s;
        target = s.history[index];
        const afterTarget = s.history.slice(index + 1);
        const currentSnap: HistoryEntry = {
          dataURL: baseURL ?? "",
          width: imgSize.width,
          height: imgSize.height,
        };
        const nextRedo = [...afterTarget].reverse();
        return {
          history: s.history.slice(0, index),
          redoStack: [...s.redoStack, currentSnap, ...nextRedo],
        };
      });
      if (target) restoreEntry(target);
    },
    [baseURL, imgSize, restoreEntry]
  );

  const setHistory = useCallback(
    (value: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[])) => {
      setStacks((s) => ({
        ...s,
        history: typeof value === "function" ? value(s.history) : value,
      }));
    },
    []
  );

  const setRedoStack = useCallback(
    (value: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[])) => {
      setStacks((s) => ({
        ...s,
        redoStack:
          typeof value === "function" ? value(s.redoStack) : value,
      }));
    },
    []
  );

  return {
    history,
    redoStack,
    pushHistory,
    undo,
    redoAction,
    cancelToFirst,
    jumpToHistory,
    setHistory,
    setRedoStack,
  };
}
