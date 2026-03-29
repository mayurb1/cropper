import { useEffect, useRef } from "react";

export interface KeyboardShortcutsHandlers {
  onUndo: () => void;
  onRedo: () => void;
  onEscape: () => void;
  onEnter: () => void;
  onToggleHelp: () => void;
  /** Called on each keydown to decide if shortcuts are active */
  getEnabled: () => boolean;
  /** Skip shortcuts while typing in inputs */
  isTargetEditable: (target: EventTarget | null) => boolean;
}

/**
 * Registers document-level shortcuts: undo/redo, escape, enter to apply, ? for help.
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutsHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = ref.current;
      if (!h.getEnabled()) return;
      if (h.isTargetEditable(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        h.onUndo();
        return;
      }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        h.onRedo();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        h.onEscape();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        h.onEnter();
        return;
      }
      if (e.key === "?" && !mod) {
        e.preventDefault();
        h.onToggleHelp();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}
