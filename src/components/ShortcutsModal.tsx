import React from "react";
import type { ImageEditorLabels } from "../types";

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  labels: ImageEditorLabels;
}

const ROW: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  padding: "8px 0",
  borderBottom: "1px solid var(--rp-border)",
  fontSize: 14,
  color: "var(--rp-text)",
};

const KBD: React.CSSProperties = {
  fontFamily: "monospace",
  background: "var(--rp-input-bg)",
  padding: "4px 8px",
  borderRadius: 4,
  border: "1px solid var(--rp-border)",
};

/**
 * Modal listing keyboard shortcuts for the editor.
 */
export function ShortcutsModal({ open, onClose, labels }: ShortcutsModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={labels.keyboardShortcuts}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10001,
        background: "var(--rp-overlay)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        style={{
          background: "var(--rp-bg)",
          border: "1px solid var(--rp-border)",
          borderRadius: 12,
          padding: 20,
          maxWidth: 420,
          width: "100%",
          boxShadow: "var(--rp-shadow)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              color: "var(--rp-text)",
            }}
          >
            {labels.keyboardShortcuts}
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--rp-text-muted)",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
            aria-label={labels.shortcutsClose}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={ROW}>
            <span>{labels.shortcutUndo}</span>
            <kbd style={KBD}>Ctrl+Z</kbd>
          </div>
          <div style={ROW}>
            <span>{labels.shortcutRedo}</span>
            <kbd style={KBD}>Ctrl+Y / Ctrl+Shift+Z</kbd>
          </div>
          <div style={ROW}>
            <span>{labels.shortcutEscape}</span>
            <kbd style={KBD}>Esc</kbd>
          </div>
          <div style={ROW}>
            <span>{labels.shortcutEnter}</span>
            <kbd style={KBD}>Enter</kbd>
          </div>
          <div style={{ ...ROW, borderBottom: "none" }}>
            <span>{labels.shortcutHelp}</span>
            <kbd style={KBD}>?</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
