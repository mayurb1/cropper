import React from "react";
import type { ImageEditorLabels } from "../types";
import {
  primaryBtn,
  outlineBtn,
  getBtnDisabledStyle,
  getGhostDisabledStyle,
  rpBtnPrimary,
  rpBtnOutline,
  rpBtnSurface,
  rpBtnGhost,
} from "../styles";

export interface EditorFooterProps {
  historyLength: number;
  redoLength: number;
  onUndo: () => void;
  onRedo: () => void;
  onCancel: () => void;
  onSave: () => void;
  labels: ImageEditorLabels;
  onToggleHistory?: () => void;
  historyPanelOpen?: boolean;
  onBatchApplyAll?: () => void;
  batchApplyDisabled?: boolean;
  showBatchApply?: boolean;
  compact?: boolean;
}

/**
 * Bottom bar: undo/redo icons, cancel, save; optional history and batch actions.
 */
export function EditorFooter({
  historyLength,
  redoLength,
  onUndo,
  onRedo,
  onCancel,
  onSave,
  labels,
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
        gap: "var(--rp-space-3)",
        marginTop: "var(--rp-space-4)",
        paddingTop: "var(--rp-space-3)",
        borderTop: "1px solid var(--rp-border)",
        fontFamily: "var(--rp-font-family)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--rp-space-2)",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className={rpBtnSurface}
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
            borderRadius: "var(--rp-radius-sm)",
          }}
        >
          ↶
        </button>
        <button
          type="button"
          className={rpBtnSurface}
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
            borderRadius: "var(--rp-radius-sm)",
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
            margin: "0 var(--rp-space-1)",
          }}
        />
        {onToggleHistory ? (
          <button
            type="button"
            className={rpBtnSurface}
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
              borderRadius: "var(--rp-radius-sm)",
            }}
          >
            ⧉
          </button>
        ) : null}
        <button
          type="button"
          className={rpBtnGhost}
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--rp-space-2)",
          flexWrap: "wrap",
        }}
      >
        {showBatchApply && onBatchApplyAll ? (
          <button
            type="button"
            className={rpBtnOutline}
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
        <button
          type="button"
          className={rpBtnPrimary}
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
