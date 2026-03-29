import React from "react";
import type { ImageEditorLabels } from "../types";
import {
  primaryBtn,
  outlineBtn,
  getBtnDisabledStyle,
  getGhostDisabledStyle,
} from "../styles";

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
  onToggleHistory?: () => void;
  historyPanelOpen?: boolean;
  onBatchApplyAll?: () => void;
  batchApplyDisabled?: boolean;
  showBatchApply?: boolean;
  compact?: boolean;
}

/**
 * Bottom bar: undo/redo icons, cancel, upload, save; optional history and batch actions.
 */
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
  onToggleHistory,
  historyPanelOpen,
  onBatchApplyAll,
  batchApplyDisabled,
  showBatchApply,
  compact = false,
}: EditorFooterProps) {
  const iconSize = compact ? 44 : 40;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 16,
        paddingTop: 12,
        borderTop: "1px solid var(--rp-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          title={labels.undo}
          aria-label={labels.undo}
          onClick={onUndo}
          disabled={historyLength === 0}
          style={{
            ...getBtnDisabledStyle(historyLength === 0),
            minWidth: iconSize,
            minHeight: iconSize,
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ↶
        </button>
        <button
          type="button"
          title={labels.redo}
          aria-label={labels.redo}
          onClick={onRedo}
          disabled={redoLength === 0}
          style={{
            ...getBtnDisabledStyle(redoLength === 0),
            minWidth: iconSize,
            minHeight: iconSize,
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ↷
        </button>
        <div
          aria-hidden
          style={{
            width: 1,
            height: 24,
            background: "var(--rp-border)",
            margin: "0 4px",
          }}
        />
        {onToggleHistory ? (
          <button
            type="button"
            title={labels.historyToggle}
            aria-label={labels.historyToggle}
            aria-pressed={historyPanelOpen}
            onClick={onToggleHistory}
            disabled={historyLength === 0}
            style={{
              ...getBtnDisabledStyle(historyLength === 0),
              minWidth: iconSize,
              minHeight: iconSize,
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ⧉
          </button>
        ) : null}
        <button
          type="button"
          style={{
            ...getGhostDisabledStyle(historyLength === 0),
            minHeight: compact ? 44 : undefined,
          }}
          onClick={onCancel}
          disabled={historyLength === 0}
        >
          {labels.cancelEditing}
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 8 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {showBatchApply && onBatchApplyAll ? (
          <button
            type="button"
            style={{
              ...outlineBtn,
              minHeight: compact ? 44 : undefined,
              opacity: batchApplyDisabled ? 0.5 : 1,
              cursor: batchApplyDisabled ? "not-allowed" : "pointer",
            }}
            onClick={onBatchApplyAll}
            disabled={batchApplyDisabled}
          >
            {labels.batchApplyAll}
          </button>
        ) : null}
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
          style={{
            ...outlineBtn,
            minHeight: compact ? 44 : undefined,
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {labels.upload}
        </button>
        <button
          type="button"
          style={{
            ...primaryBtn,
            minHeight: compact ? 44 : undefined,
          }}
          onClick={onSave}
        >
          {labels.save}
        </button>
      </div>
    </div>
  );
}
