import React from "react";
import type { ImageEditorLabels } from "../types";
import { baseBtn, primaryBtn, getBtnDisabledStyle } from "../styles";

export interface EditorFooterProps {
  historyLength: number;
  redoLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onPickFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  labels: ImageEditorLabels;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function EditorFooter({
  historyLength,
  redoLength,
  onUndo,
  onRedo,
  onCancel,
  onPickFile,
  onSave,
  labels,
  fileInputRef,
}: EditorFooterProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid var(--rp-border)",
      }}
    >
      <span style={{ fontSize: 13, color: "var(--rp-text-muted)" }}>
        {labels.editThenSave}
      </span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          style={getBtnDisabledStyle(historyLength === 0)}
          onClick={onUndo}
          disabled={historyLength === 0}
        >
          {labels.undo}
        </button>
        <button
          type="button"
          style={getBtnDisabledStyle(redoLength === 0)}
          onClick={onRedo}
          disabled={redoLength === 0}
        >
          {labels.redo}
        </button>
        <button
          type="button"
          style={getBtnDisabledStyle(historyLength === 0)}
          onClick={onCancel}
          disabled={historyLength === 0}
        >
          {labels.cancelEditing}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={onPickFile}
          aria-hidden
        />
        <button
          type="button"
          style={baseBtn}
          onClick={() => fileInputRef.current?.click()}
        >
          {labels.upload}
        </button>
        <button type="button" style={primaryBtn} onClick={onSave}>
          {labels.save}
        </button>
      </div>
    </div>
  );
}
