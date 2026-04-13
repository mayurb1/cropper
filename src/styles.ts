import type { CSSProperties } from "react";

/** Class hooks for injected chrome (hover/focus). */
export const rpBtn = "rp-btn";
export const rpBtnPrimary = "rp-btn rp-btn--primary";
export const rpBtnOutline = "rp-btn rp-btn--outline";
export const rpBtnSurface = "rp-btn rp-btn--surface";
export const rpBtnGhost = "rp-btn rp-btn--ghost";
export const rpTab = "rp-tab";

/** Shared button style – uses CSS variables so theme applies. */
export const baseBtn: CSSProperties = {
  padding: "10px 14px",
  border: "1px solid var(--rp-border)",
  background: "var(--rp-surface)",
  color: "var(--rp-text)",
  borderRadius: "var(--rp-radius-sm)",
  cursor: "pointer",
  fontSize: "var(--rp-font-size-md)",
  fontFamily: "var(--rp-font-family)",
  fontWeight: 500,
  lineHeight: 1.25,
};

export const primaryBtn: CSSProperties = {
  ...baseBtn,
  border: "1px solid var(--rp-primary)",
  background: "var(--rp-primary)",
  color: "#ffffff",
};

/** Secondary outline (e.g. Upload). */
export const outlineBtn: CSSProperties = {
  ...baseBtn,
  border: "1px solid var(--rp-border)",
  background: "var(--rp-surface)",
  color: "var(--rp-primary)",
};

/** Text / ghost (e.g. Cancel). */
export const ghostBtn: CSSProperties = {
  padding: "10px 14px",
  border: "none",
  background: "transparent",
  color: "var(--rp-text-muted)",
  borderRadius: "var(--rp-radius-sm)",
  cursor: "pointer",
  fontSize: "var(--rp-font-size-md)",
  fontFamily: "var(--rp-font-family)",
  fontWeight: 500,
  lineHeight: 1.25,
};

export function getBtnDisabledStyle(disabled: boolean): CSSProperties {
  return {
    ...baseBtn,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

export function getGhostDisabledStyle(disabled: boolean): CSSProperties {
  return {
    ...ghostBtn,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

export const inputStyle: CSSProperties = {
  padding: "10px 12px",
  border: "1px solid var(--rp-border)",
  borderRadius: "var(--rp-radius-sm)",
  fontSize: "var(--rp-font-size-md)",
  fontFamily: "var(--rp-font-family)",
  background: "var(--rp-surface-muted)",
  color: "var(--rp-text)",
  width: "100%",
};
