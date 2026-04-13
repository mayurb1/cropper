import type { CSSProperties } from "react";

/** Right sidebar shell: white card on muted rail (reference layout). */
export const sidebarShellStyle: CSSProperties = {
  flex: "0 0 320px",
  maxWidth: "100%",
  minHeight: 0,
  maxHeight: "100%",
  overflowY: "auto",
  padding: "var(--rp-space-4)",
  background: "var(--rp-surface)",
  border: "1px solid var(--rp-border)",
  borderRadius: "var(--rp-radius-md)",
  minWidth: 280,
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 1px 2px color-mix(in srgb, var(--rp-text) 4%, transparent)",
};

/** Section title (uppercase muted) — shared across sidebars. */
export const sidebarSectionLabelStyle: CSSProperties = {
  fontSize: "var(--rp-font-size-xs)",
  fontWeight: 600,
  color: "var(--rp-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "var(--rp-space-2)",
  fontFamily: "var(--rp-font-family)",
};

/** Inner card inside sidebar. */
export const sidebarCardStyle: CSSProperties = {
  border: "1px solid var(--rp-border)",
  borderRadius: "var(--rp-radius-sm)",
  background: "var(--rp-surface-muted)",
  overflow: "hidden",
};
