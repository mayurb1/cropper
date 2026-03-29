import React from "react";
import type { FilterConfig, ImageEditorLabels } from "../types";
import { baseBtn, primaryBtn } from "../styles";
import { isFilterDefault } from "../utils/filterString";

export interface FiltersSidebarProps {
  filter: FilterConfig;
  setFilter: React.Dispatch<React.SetStateAction<FilterConfig>>;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  labels: ImageEditorLabels;
  baseURL: string | null;
  compact?: boolean;
}

const SIDEBAR_STYLE: React.CSSProperties = {
  flex: "0 0 320px",
  maxWidth: "100%",
  padding: 16,
  background: "var(--rp-surface)",
  border: "1px solid var(--rp-border)",
  borderRadius: 12,
  minWidth: 280,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--rp-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 4,
};

/**
 * Brightness, contrast, saturation sliders and quick preset buttons.
 * @example
 * ```tsx
 * <FiltersSidebar filter={f} setFilter={setF} onApplyFilters={apply} onResetFilters={reset} labels={l} baseURL={url} />
 * ```
 */
export function FiltersSidebar({
  filter,
  setFilter,
  onApplyFilters,
  onResetFilters,
  labels,
  baseURL,
  compact = false,
}: FiltersSidebarProps) {
  const disabled = !baseURL;
  const canApply = !disabled && !isFilterDefault(filter);

  return (
    <div
      id="react-pixcraft-panel-filters"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-filters"
      style={SIDEBAR_STYLE}
    >
      <div>
        <div style={LABEL}>{labels.brightness}</div>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.01}
          value={filter.brightness}
          onChange={(e) =>
            setFilter((f) => ({ ...f, brightness: Number(e.target.value) }))
          }
          disabled={disabled}
          style={{ width: "100%", accentColor: "var(--rp-primary)" }}
        />
        <div style={{ fontSize: 12, color: "var(--rp-text-muted)" }}>
          {Math.round(filter.brightness * 100)}%
        </div>
      </div>
      <div>
        <div style={LABEL}>{labels.contrast}</div>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.01}
          value={filter.contrast}
          onChange={(e) =>
            setFilter((f) => ({ ...f, contrast: Number(e.target.value) }))
          }
          disabled={disabled}
          style={{ width: "100%", accentColor: "var(--rp-primary)" }}
        />
        <div style={{ fontSize: 12, color: "var(--rp-text-muted)" }}>
          {Math.round(filter.contrast * 100)}%
        </div>
      </div>
      <div>
        <div style={LABEL}>{labels.saturation}</div>
        <input
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={filter.saturation}
          onChange={(e) =>
            setFilter((f) => ({ ...f, saturation: Number(e.target.value) }))
          }
          disabled={disabled}
          style={{ width: "100%", accentColor: "var(--rp-primary)" }}
        />
        <div style={{ fontSize: 12, color: "var(--rp-text-muted)" }}>
          {Math.round(filter.saturation * 100)}%
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          style={{
            ...baseBtn,
            minHeight: compact ? 44 : undefined,
            opacity: disabled ? 0.5 : 1,
          }}
          disabled={disabled}
          onClick={() =>
            setFilter((f) => ({ ...f, grayscale: f.grayscale > 0 ? 0 : 1 }))
          }
        >
          {labels.presetGrayscale}
        </button>
        <button
          type="button"
          style={{
            ...baseBtn,
            minHeight: compact ? 44 : undefined,
            opacity: disabled ? 0.5 : 1,
          }}
          disabled={disabled}
          onClick={() =>
            setFilter((f) => ({ ...f, sepia: f.sepia > 0 ? 0 : 1 }))
          }
        >
          {labels.presetSepia}
        </button>
        <button
          type="button"
          style={{
            ...baseBtn,
            minHeight: compact ? 44 : undefined,
            opacity: disabled ? 0.5 : 1,
          }}
          disabled={disabled}
          onClick={() =>
            setFilter((f) => ({ ...f, blurPx: f.blurPx > 0 ? 0 : 4 }))
          }
        >
          {labels.presetBlur}
        </button>
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          style={primaryBtn}
          disabled={!canApply}
          onClick={onApplyFilters}
        >
          {labels.applyFilters}
        </button>
        <button
          type="button"
          style={baseBtn}
          disabled={disabled || isFilterDefault(filter)}
          onClick={onResetFilters}
        >
          {labels.resetFilters}
        </button>
      </div>
    </div>
  );
}
