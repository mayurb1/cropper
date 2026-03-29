import React from "react";
import type { HistoryEntry, ImageEditorLabels } from "../types";

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
        marginTop: 12,
        border: "1px solid var(--rp-border)",
        borderRadius: 12,
        background: "var(--rp-surface)",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "none",
          background: "var(--rp-input-bg)",
          color: "var(--rp-text)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
            padding: 8,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            maxHeight: 200,
            overflow: "auto",
          }}
        >
          {history.map((entry, index) => (
            <li key={`${entry.dataURL.slice(0, 32)}-${index}`}>
              <button
                type="button"
                onClick={() => onJumpTo(index)}
                style={{
                  padding: 4,
                  border: "1px solid var(--rp-border)",
                  borderRadius: 8,
                  background: "var(--rp-bg)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
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
                    borderRadius: 4,
                    display: "block",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--rp-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 80,
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
