import type { CSSProperties } from "react";

/** Shared button style – uses CSS variables so theme applies. */
export const baseBtn: CSSProperties = {
  padding: "8px 12px",
  border: "1px solid var(--rp-border)",
  background: "var(--rp-surface)",
  color: "var(--rp-text)",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 14,
};

export const primaryBtn: CSSProperties = {
  ...baseBtn,
  border: "1px solid var(--rp-primary)",
  background: "var(--rp-primary)",
  color: "white",
};

export function getBtnDisabledStyle(disabled: boolean): CSSProperties {
  return {
    ...baseBtn,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

export const inputStyle: CSSProperties = {
  padding: 8,
  border: "1px solid var(--rp-border)",
  borderRadius: 6,
  fontSize: 14,
  background: "var(--rp-input-bg)",
  color: "var(--rp-text)",
  width: "100%",
};
