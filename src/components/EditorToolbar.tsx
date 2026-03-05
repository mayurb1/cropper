import React from "react";
import type { ImageEditorLabels, ImageEditorStyles } from "../types";
import type { TabId } from "../constants";
import { TABS } from "../constants";

export interface EditorToolbarProps {
  activeTab: string;
  onTabChange: (tab: TabId) => void;
  onClose: () => void;
  labels: ImageEditorLabels;
  classNameToolbar?: string;
  styles?: ImageEditorStyles;
}

export function EditorToolbar({
  activeTab,
  onTabChange,
  onClose,
  labels,
  classNameToolbar,
  styles,
}: EditorToolbarProps) {
  return (
    <div
      className={classNameToolbar}
      role="tablist"
      aria-label={labels.title}
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: 0,
        marginBottom: 16,
        borderBottom: "1px solid var(--rp-border)",
        ...styles?.toolbar,
      }}
    >
      {TABS.map((tabId) => {
        const isActive = activeTab === tabId;
        const label = labels[tabId as keyof ImageEditorLabels] ?? tabId;
        return (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`react-pixcraft-panel-${tabId}`}
            id={`react-pixcraft-tab-${tabId}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tabId)}
            style={{
              padding: "10px 16px",
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
          padding: "8px 12px",
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
