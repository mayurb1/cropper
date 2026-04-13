import React from "react";
import type { ImageEditorLabels } from "../types";
import { rpBtnGhost } from "../styles";

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  labels: ImageEditorLabels;
}

const ROW: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "var(--rp-space-4)",
  padding: "10px 0",
  borderBottom: "1px solid var(--rp-border)",
  fontSize: "var(--rp-font-size-md)",
  color: "var(--rp-text)",
  fontFamily: "var(--rp-font-family)",
};

const KBD: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  background: "var(--rp-surface-muted)",
  padding: "6px 10px",
  borderRadius: "var(--rp-radius-sm)",
  border: "1px solid var(--rp-border)",
  fontSize: "var(--rp-font-size-sm)",
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
        padding: "var(--rp-space-4)",
        fontFamily: "var(--rp-font-family)",
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        style={{
          background: "var(--rp-surface)",
          border: "1px solid var(--rp-border)",
          borderRadius: "var(--rp-radius-lg)",
          padding: "var(--rp-space-5)",
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
            marginBottom: "var(--rp-space-4)",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--rp-text)",
              fontFamily: "var(--rp-font-family)",
            }}
          >
            {labels.keyboardShortcuts}
          </h3>
          <button
            type="button"
            className={rpBtnGhost}
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--rp-text-muted)",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
              padding: "var(--rp-space-2)",
              borderRadius: "var(--rp-radius-sm)",
            }}
            aria-label={labels.shortcutsClose}
          >
            ×
          </button>
        </div>
        <div style={{ marginBottom: "var(--rp-space-2)" }}>
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
