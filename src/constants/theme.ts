/** Theme tokens – consumers can override via CSS variables on .react-pixcraft-editor */
export const LIGHT_VARS: Record<string, string> = {
  "--rp-bg": "#ffffff",
  "--rp-surface": "#f6f8fa",
  "--rp-border": "#d0d7de",
  "--rp-text": "#24292f",
  "--rp-text-muted": "#57606a",
  "--rp-primary": "#218bff",
  "--rp-primary-hover": "#0969da",
  "--rp-input-bg": "#ffffff",
  "--rp-overlay": "rgba(0,0,0,0.6)",
  "--rp-shadow": "0 25px 50px -12px rgba(0,0,0,0.25)",
  "--rp-checker": "#eee",
};

export const DARK_VARS: Record<string, string> = {
  "--rp-bg": "#1c2128",
  "--rp-surface": "#21262d",
  "--rp-border": "#373e47",
  "--rp-text": "#e6edf3",
  "--rp-text-muted": "#8b949e",
  "--rp-primary": "#58a6ff",
  "--rp-primary-hover": "#79b8ff",
  "--rp-input-bg": "#0d1117",
  "--rp-overlay": "rgba(0,0,0,0.75)",
  "--rp-shadow": "0 25px 50px -12px rgba(0,0,0,0.5)",
  "--rp-checker": "#30363d",
};
