import type { CSSProperties } from "react";

/** Focusable elements for modal focus trap and initial focus. */
export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const liveRegionStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

export const toastFixedStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 10002,
  padding: "10px 16px",
  background: "var(--rp-surface)",
  border: "1px solid var(--rp-border)",
  borderRadius: 8,
  boxShadow: "var(--rp-shadow)",
  fontSize: 14,
  color: "var(--rp-text)",
};

export const modalInnerColumnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
};

export const displayContentsStyle: CSSProperties = { display: "contents" };

export const headerRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
  flexWrap: "wrap",
  gap: 8,
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: "var(--rp-text)",
};

export const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--rp-text-muted)",
  display: "block",
  marginTop: 2,
};

export const processingHeaderStyle: CSSProperties = {
  fontSize: 13,
  color: "var(--rp-primary)",
};

export const mainRowStyle = (modal: boolean): CSSProperties => ({
  display: "flex",
  flexDirection: "row",
  flexWrap: "nowrap",
  gap: 16,
  alignItems: modal ? "stretch" : "flex-start",
  width: "100%",
  minWidth: 0,
  ...(modal
    ? {
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }
    : { overflowX: "auto" }),
});

export const batchStripStyle = (compact: boolean): CSSProperties => ({
  display: "flex",
  gap: 8,
  flex: "0 0 auto",
  flexShrink: 0,
  maxHeight: compact ? 120 : 360,
  overflowX: compact ? "auto" : "hidden",
  overflowY: compact ? "hidden" : "auto",
  flexDirection: compact ? "row" : "column",
});

export const canvasColumnStyle = (
  sidebarActive: boolean,
  modal: boolean
): CSSProperties => ({
  flex: sidebarActive ? "1 1 0" : "1 1 100%",
  minWidth: 0,
  ...(modal ? { minHeight: 0, overflow: "auto" } : {}),
});

export const customTabPanelStyle: CSSProperties = {
  flex: "0 0 320px",
  flexShrink: 0,
  minWidth: 280,
  maxWidth: "100%",
  minHeight: 0,
  maxHeight: "100%",
  overflowY: "auto",
};

export const cropOverlayHintStyle: CSSProperties = {
  fontSize: 12,
  color: "var(--rp-text-muted)",
  marginBottom: 6,
};

export const viewportHintStyle: CSSProperties = {
  textAlign: "center",
  marginTop: 6,
  fontSize: 12,
  color: "var(--rp-text-muted)",
};

export const loadingCanvasPlaceholderStyle: CSSProperties = {
  minHeight: 320,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--rp-text-muted)",
  fontSize: 14,
};

export const editorRootStyle: CSSProperties = {
  position: "relative",
};

export const inlineCardStyle: CSSProperties = {
  border: "1px solid var(--rp-border)",
  borderRadius: 12,
  padding: 16,
  background: "var(--rp-bg)",
};

export const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "var(--rp-overlay)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

export const modalShellStyle: CSSProperties = {
  position: "relative",
};
