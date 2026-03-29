import React, { useCallback, useRef } from "react";
import type { ImageEditorLabels, ImageEditorStyles } from "../types";
import type { TabId } from "../constants";

export interface EditorToolbarTab {
  id: TabId;
  label: string;
}

export interface EditorToolbarProps {
  /** Tabs to display (core tabs + optional custom tab from parent) */
  tabs: EditorToolbarTab[];
  activeTab: string;
  onTabChange: (tab: TabId) => void;
  onClose: () => void;
  labels: ImageEditorLabels;
  classNameToolbar?: string;
  styles?: ImageEditorStyles;
  compact?: boolean;
}

/**
 * Tab list with arrow-key navigation (roving tabindex).
 */
export function EditorToolbar({
  tabs,
  activeTab,
  onTabChange,
  onClose,
  labels,
  classNameToolbar,
  styles,
  compact = false,
}: EditorToolbarProps) {
  const tablistRef = useRef<HTMLDivElement>(null);

  const focusTabIndex = useCallback((idx: number) => {
    const root = tablistRef.current;
    if (!root) return;
    const buttons = root.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]'
    );
    const el = buttons[idx];
    el?.focus();
  }, []);

  const onTabListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const ids = tabs.map((t) => t.id);
      const cur = ids.indexOf(activeTab as TabId);
      if (cur < 0) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = (cur + 1) % ids.length;
        onTabChange(ids[next]);
        requestAnimationFrame(() => focusTabIndex(next));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (cur - 1 + ids.length) % ids.length;
        onTabChange(ids[prev]);
        requestAnimationFrame(() => focusTabIndex(prev));
      } else if (e.key === "Home") {
        e.preventDefault();
        onTabChange(ids[0]);
        requestAnimationFrame(() => focusTabIndex(0));
      } else if (e.key === "End") {
        e.preventDefault();
        const last = ids.length - 1;
        onTabChange(ids[last]);
        requestAnimationFrame(() => focusTabIndex(last));
      }
    },
    [tabs, activeTab, onTabChange, focusTabIndex]
  );

  return (
    <div
      ref={tablistRef}
      className={classNameToolbar}
      role="tablist"
      aria-label={labels.title}
      onKeyDown={onTabListKeyDown}
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        marginBottom: 16,
        borderBottom: "1px solid var(--rp-border)",
        flexWrap: compact ? "wrap" : "nowrap",
        ...styles?.toolbar,
      }}
    >
      {tabs.map(({ id, label }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`react-pixcraft-panel-${id}`}
            id={`react-pixcraft-tab-${id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(id)}
            style={{
              padding: compact ? "12px 14px" : "10px 16px",
              minHeight: compact ? 44 : undefined,
              border: "none",
              borderBottom: isActive
                ? "2px solid var(--rp-primary)"
                : "2px solid transparent",
              background: isActive ? "var(--rp-primary)" : "transparent",
              color: isActive ? "white" : "var(--rp-text-muted)",
              borderRadius: "8px 8px 0 0",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {label}
          </button>
        );
      })}
      <div style={{ flex: 1, minWidth: 8 }} />
      <button
        type="button"
        aria-label={labels.close}
        onClick={onClose}
        style={{
          padding: compact ? "12px 14px" : "8px 12px",
          minWidth: compact ? 44 : undefined,
          minHeight: compact ? 44 : undefined,
          border: "none",
          background: "transparent",
          color: "var(--rp-text-muted)",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
