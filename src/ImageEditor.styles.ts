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
  padding: "12px 18px",
  background: "var(--rp-surface)",
  border: "1px solid var(--rp-border)",
  borderRadius: "var(--rp-radius-md)",
  boxShadow: "var(--rp-shadow)",
  fontSize: "var(--rp-font-size-md)",
  fontFamily: "var(--rp-font-family)",
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
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: "var(--rp-space-3)",
  flexWrap: "wrap",
  gap: "var(--rp-space-2)",
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "var(--rp-font-size-lg)",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  color: "var(--rp-text)",
  fontFamily: "var(--rp-font-family)",
};

export const subtitleStyle: CSSProperties = {
  fontSize: "var(--rp-font-size-sm)",
  color: "var(--rp-text-muted)",
  display: "block",
  marginTop: "var(--rp-space-1)",
  fontFamily: "var(--rp-font-family)",
};

export const processingHeaderStyle: CSSProperties = {
  fontSize: "var(--rp-font-size-md)",
  color: "var(--rp-primary)",
  fontFamily: "var(--rp-font-family)",
};

export const mainRowStyle = (modal: boolean): CSSProperties => ({
  display: "flex",
  flexDirection: "row",
  flexWrap: "nowrap",
  gap: "var(--rp-space-4)",
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
  gap: "var(--rp-space-2)",
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
  fontSize: "var(--rp-font-size-sm)",
  color: "var(--rp-text-muted)",
  marginBottom: "var(--rp-space-2)",
  fontFamily: "var(--rp-font-family)",
};

export const viewportHintStyle: CSSProperties = {
  textAlign: "center",
  marginTop: "var(--rp-space-2)",
  fontSize: "var(--rp-font-size-sm)",
  color: "var(--rp-text-muted)",
  fontFamily: "var(--rp-font-family)",
};

export const loadingCanvasPlaceholderStyle: CSSProperties = {
  minHeight: 320,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "var(--rp-text-muted)",
  fontSize: "var(--rp-font-size-md)",
  fontFamily: "var(--rp-font-family)",
};

export const editorRootStyle: CSSProperties = {
  position: "relative",
};

/** Outer card (non-modal). */
export const inlineCardStyle: CSSProperties = {
  border: "1px solid var(--rp-border)",
  borderRadius: "var(--rp-radius-lg)",
  padding: "var(--rp-space-4)",
  background: "var(--rp-surface)",
  boxShadow: "0 1px 3px color-mix(in srgb, var(--rp-text) 6%, transparent)",
};

export const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "var(--rp-overlay)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--rp-space-4)",
};

export const modalShellStyle: CSSProperties = {
  position: "relative",
};

export {
  sidebarShellStyle,
  sidebarSectionLabelStyle,
  sidebarCardStyle,
} from "./editorShell.styles";

export const canvasWrapperOuterStyle: CSSProperties = {
  border: "1px solid var(--rp-border)",
  borderRadius: "var(--rp-radius-md)",
  padding: "var(--rp-space-3)",
  background: "var(--rp-surface-muted)",
  boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--rp-text) 4%, transparent)",
};
