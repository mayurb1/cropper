import { useCallback, useLayoutEffect, useReducer } from "react";
import type { HistoryEntry } from "../types";

interface HistoryStacks {
  history: HistoryEntry[];
  redoStack: HistoryEntry[];
}

type EditorHistoryState = HistoryStacks & {
  /** Set by reducer; consumed in useLayoutEffect to call restoreEntry once. */
  restoreTarget: HistoryEntry | null;
};

const initialState: EditorHistoryState = {
  history: [],
  redoStack: [],
  restoreTarget: null,
};

type EditorHistoryAction =
  | { type: "push"; url: string; w: number; h: number; label?: string }
  | { type: "undo"; currentSnap: HistoryEntry }
  | { type: "redo"; currentSnap: HistoryEntry }
  | { type: "cancelToFirst" }
  | { type: "jumpTo"; index: number; currentSnap: HistoryEntry }
  | { type: "setHistory"; value: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[]) }
  | {
      type: "setRedoStack";
      value: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[]);
    }
  | { type: "clearRestore" };

function reducer(
  state: EditorHistoryState,
  action: EditorHistoryAction
): EditorHistoryState {
  switch (action.type) {
    case "push":
      return {
        ...state,
        restoreTarget: null,
        history: [
          ...state.history,
          { dataURL: action.url, width: action.w, height: action.h, label: action.label },
        ],
        redoStack: [],
      };
    case "undo": {
      if (state.history.length === 0) return state;
      const prev = state.history[state.history.length - 1];
      return {
        history: state.history.slice(0, -1),
        redoStack: [...state.redoStack, action.currentSnap],
        restoreTarget: prev,
      };
    }
    case "redo": {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        history: [...state.history, action.currentSnap],
        redoStack: state.redoStack.slice(0, -1),
        restoreTarget: next,
      };
    }
    case "cancelToFirst": {
      if (state.history.length === 0) return state;
      const first = state.history[0];
      return {
        history: [],
        redoStack: [],
        restoreTarget: first,
      };
    }
    case "jumpTo": {
      const { index, currentSnap } = action;
      if (index < 0 || index >= state.history.length) return state;
      const target = state.history[index];
      const afterTarget = state.history.slice(index + 1);
      const nextRedo = [...afterTarget].reverse();
      return {
        history: state.history.slice(0, index),
        redoStack: [...state.redoStack, currentSnap, ...nextRedo],
        restoreTarget: target,
      };
    }
    case "setHistory":
      return {
        ...state,
        restoreTarget: null,
        history:
          typeof action.value === "function"
            ? action.value(state.history)
            : action.value,
      };
    case "setRedoStack":
      return {
        ...state,
        restoreTarget: null,
        redoStack:
          typeof action.value === "function"
            ? action.value(state.redoStack)
            : action.value,
      };
    case "clearRestore":
      return { ...state, restoreTarget: null };
    default:
      return state;
  }
}

/**
 * Undo/redo stacks with atomic updates via useReducer.
 * Restore runs once per transition in useLayoutEffect.
 */
export function useEditorHistory(
  baseURL: string | null,
  imgSize: { width: number; height: number },
  setBaseURL: (url: string | null) => void,
  setImgSize: (size: { width: number; height: number }) => void
) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { history, redoStack } = state;

  const restoreEntry = useCallback(
    (entry: HistoryEntry) => {
      setBaseURL(entry.dataURL);
      setImgSize({ width: entry.width, height: entry.height });
    },
    [setBaseURL, setImgSize]
  );

  useLayoutEffect(() => {
    if (!state.restoreTarget) return;
    restoreEntry(state.restoreTarget);
    dispatch({ type: "clearRestore" });
  }, [state.restoreTarget, restoreEntry]);

  const currentSnap = (): HistoryEntry => ({
    dataURL: baseURL ?? "",
    width: imgSize.width,
    height: imgSize.height,
  });

  const pushHistory = useCallback((url: string, w: number, h: number, label?: string) => {
    dispatch({ type: "push", url, w, h, label });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "undo", currentSnap: currentSnap() });
  }, [baseURL, imgSize.width, imgSize.height]);

  const redoAction = useCallback(() => {
    dispatch({ type: "redo", currentSnap: currentSnap() });
  }, [baseURL, imgSize.width, imgSize.height]);

  const cancelToFirst = useCallback(() => {
    dispatch({ type: "cancelToFirst" });
  }, []);

  const jumpToHistory = useCallback(
    (index: number) => {
      dispatch({ type: "jumpTo", index, currentSnap: currentSnap() });
    },
    [baseURL, imgSize.width, imgSize.height]
  );

  const setHistory = useCallback(
    (value: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[])) => {
      dispatch({ type: "setHistory", value });
    },
    []
  );

  const setRedoStack = useCallback(
    (value: HistoryEntry[] | ((prev: HistoryEntry[]) => HistoryEntry[])) => {
      dispatch({ type: "setRedoStack", value });
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
