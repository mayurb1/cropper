/** Injected once: focus-visible, motion, thin scrollbars, and button hover helpers for `.react-pixcraft-editor`. */
const STYLE_ID = "react-pixcraft-editor-chrome";

const CHROME_CSS = `
.react-pixcraft-editor {
  font-family: var(--rp-font-family);
  -webkit-font-smoothing: antialiased;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--rp-text) 30%, transparent) transparent;
}
.react-pixcraft-editor::-webkit-scrollbar,
.react-pixcraft-editor *::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.react-pixcraft-editor::-webkit-scrollbar-track,
.react-pixcraft-editor *::-webkit-scrollbar-track {
  background: transparent;
}
.react-pixcraft-editor::-webkit-scrollbar-thumb,
.react-pixcraft-editor *::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--rp-text) 28%, var(--rp-border));
  border-radius: 999px;
}
.react-pixcraft-editor::-webkit-scrollbar-thumb:hover,
.react-pixcraft-editor *::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--rp-text) 42%, var(--rp-border));
}
.react-pixcraft-editor *,
.react-pixcraft-editor *::before,
.react-pixcraft-editor *::after {
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--rp-text) 30%, transparent) transparent;
}
.react-pixcraft-editor button:focus-visible,
.react-pixcraft-editor [href]:focus-visible,
.react-pixcraft-editor input:focus-visible,
.react-pixcraft-editor select:focus-visible,
.react-pixcraft-editor textarea:focus-visible {
  outline: 2px solid var(--rp-primary);
  outline-offset: 2px;
}
.react-pixcraft-editor .rp-btn {
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}
@media (prefers-reduced-motion: reduce) {
  .react-pixcraft-editor .rp-btn {
    transition: none;
  }
}
.react-pixcraft-editor .rp-btn--primary:hover:not(:disabled) {
  background: var(--rp-primary-hover);
  border-color: var(--rp-primary-hover);
}
.react-pixcraft-editor .rp-btn--outline:hover:not(:disabled) {
  background: color-mix(in srgb, var(--rp-primary) 8%, transparent);
  border-color: var(--rp-primary-hover);
  color: var(--rp-primary-hover);
}
.react-pixcraft-editor .rp-btn--surface:hover:not(:disabled) {
  background: var(--rp-surface-muted);
  border-color: var(--rp-primary);
}
.react-pixcraft-editor .rp-btn--ghost:hover:not(:disabled) {
  color: var(--rp-text);
  background: color-mix(in srgb, var(--rp-text) 6%, transparent);
}
.react-pixcraft-editor .rp-tab:hover:not(:disabled):not([aria-selected="true"]) {
  color: var(--rp-text);
  background: color-mix(in srgb, var(--rp-text) 5%, transparent);
}
`;

export function ensureEditorChromeStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = CHROME_CSS;
  document.head.appendChild(el);
}
