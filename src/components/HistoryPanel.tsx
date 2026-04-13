import React from "react";
import type { HistoryEntry, ImageEditorLabels } from "../types";
import { rpBtnSurface } from "../styles";

export interface HistoryPanelProps {
  history: HistoryEntry[];
  onJumpTo: (index: number) => void;
  labels: ImageEditorLabels;
  expanded: boolean;
  onToggle: () => void;
}

/**
 * Collapsible list of history snapshots with thumbnails; click to restore that state.
 * @example
 * ```tsx
 * <HistoryPanel history={h} onJumpTo={jump} labels={l} expanded={e} onToggle={t} />
 * ```
 */
export function HistoryPanel({
  history,
  onJumpTo,
  labels,
  expanded,
  onToggle,
}: HistoryPanelProps) {
  if (history.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "var(--rp-space-3)",
        border: "1px solid var(--rp-border)",
        borderRadius: "var(--rp-radius-md)",
        background: "var(--rp-surface)",
        overflow: "hidden",
        boxShadow: "0 1px 2px color-mix(in srgb, var(--rp-text) 4%, transparent)",
        fontFamily: "var(--rp-font-family)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: "100%",
          padding: "12px 14px",
          border: "none",
          background: "var(--rp-surface-muted)",
          color: "var(--rp-text)",
          fontSize: "var(--rp-font-size-sm)",
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--rp-font-family)",
        }}
      >
        <span>{labels.history}</span>
        <span aria-hidden>{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded ? (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "var(--rp-space-3)",
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--rp-space-2)",
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {history.map((entry, index) => (
            <li key={`${entry.dataURL.slice(0, 32)}-${index}`}>
              <button
                type="button"
                className={rpBtnSurface}
                onClick={() => onJumpTo(index)}
                style={{
                  padding: "var(--rp-space-1)",
                  border: "1px solid var(--rp-border)",
                  borderRadius: "var(--rp-radius-sm)",
                  background: "var(--rp-surface-muted)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "var(--rp-space-1)",
                  maxWidth: 88,
                }}
                title={entry.label ?? `${entry.width}×${entry.height}`}
              >
                <img
                  src={entry.dataURL}
                  alt=""
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: "var(--rp-radius-sm)",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    fontSize: "var(--rp-font-size-xs)",
                    color: "var(--rp-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 80,
                    fontFamily: "var(--rp-font-family)",
                  }}
                >
                  {entry.label ?? `${entry.width}×${entry.height}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
