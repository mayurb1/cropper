import React from "react";
import type { FilterConfig, ImageEditorLabels } from "../types";
import {
  baseBtn,
  primaryBtn,
  rpBtnPrimary,
  rpBtnSurface,
} from "../styles";
import { isFilterDefault } from "../utils/filterString";
import {
  sidebarShellStyle,
  sidebarSectionLabelStyle,
  sidebarCardStyle,
} from "../editorShell.styles";

export interface FiltersSidebarProps {
  filter: FilterConfig;
  setFilter: React.Dispatch<React.SetStateAction<FilterConfig>>;
  onApplyFilters: () => void;
  onResetFilters: () => void;
  labels: ImageEditorLabels;
  baseURL: string | null;
  compact?: boolean;
}

const sliderRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--rp-space-3)",
  marginBottom: "var(--rp-space-1)",
};

const sliderLabelStyle: React.CSSProperties = {
  flex: "0 0 100px",
  fontSize: "var(--rp-font-size-sm)",
  color: "var(--rp-text)",
  fontFamily: "var(--rp-font-family)",
  fontWeight: 500,
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

  const sliderBlock = (
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    onChange: (n: number) => void
  ) => (
    <div style={{ marginBottom: "var(--rp-space-4)" }}>
      <div style={sliderRowStyle}>
        <span style={sliderLabelStyle}>{label}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          style={{
            flex: 1,
            minWidth: 0,
            accentColor: "var(--rp-primary)",
          }}
        />
        <span
          style={{
            flex: "0 0 44px",
            textAlign: "right",
            fontSize: "var(--rp-font-size-sm)",
            color: "var(--rp-text-muted)",
            fontFamily: "var(--rp-font-family)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
  );

  return (
    <div
      id="react-pixcraft-panel-filters"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-filters"
      style={{
        ...sidebarShellStyle,
        height: "100%",
        overflowX: "hidden",
        overflowY: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          display: "flex",
          flexDirection: "column",
          gap: "var(--rp-space-3)",
        }}
      >
      <div
        style={{
          ...sidebarCardStyle,
          padding: "var(--rp-space-3)",
          flexShrink: 0,
        }}
      >
        <div style={{ ...sidebarSectionLabelStyle, marginTop: 0 }}>
          {labels.filtersAdjustments ?? "ADJUSTMENTS"}
        </div>
        {sliderBlock(
          labels.brightness ?? "Brightness",
          filter.brightness,
          0.5,
          2,
          0.01,
          (n) => setFilter((f) => ({ ...f, brightness: n }))
        )}
        {sliderBlock(
          labels.contrast ?? "Contrast",
          filter.contrast,
          0.5,
          2,
          0.01,
          (n) => setFilter((f) => ({ ...f, contrast: n }))
        )}
        {sliderBlock(
          labels.saturation ?? "Saturation",
          filter.saturation,
          0,
          2,
          0.01,
          (n) => setFilter((f) => ({ ...f, saturation: n }))
        )}
      </div>

      <div style={{ flexShrink: 0 }}>
        <div style={sidebarSectionLabelStyle}>
          {labels.filtersPresets ?? "PRESETS"}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--rp-space-2)",
          }}
        >
          <button
            type="button"
            className={rpBtnSurface}
            style={{
              ...baseBtn,
              minHeight: compact ? 44 : undefined,
              opacity: disabled ? 0.5 : 1,
              borderRadius: 999,
              fontSize: "var(--rp-font-size-sm)",
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
            className={rpBtnSurface}
            style={{
              ...baseBtn,
              minHeight: compact ? 44 : undefined,
              opacity: disabled ? 0.5 : 1,
              borderRadius: 999,
              fontSize: "var(--rp-font-size-sm)",
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
            className={rpBtnSurface}
            style={{
              ...baseBtn,
              minHeight: compact ? 44 : undefined,
              opacity: disabled ? 0.5 : 1,
              borderRadius: 999,
              fontSize: "var(--rp-font-size-sm)",
            }}
            disabled={disabled}
            onClick={() =>
              setFilter((f) => ({ ...f, blurPx: f.blurPx > 0 ? 0 : 4 }))
            }
          >
            {labels.presetBlur}
          </button>
        </div>
      </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          paddingTop: "var(--rp-space-3)",
          display: "flex",
          flexDirection: "row",
          gap: "var(--rp-space-2)",
          width: "100%",
        }}
      >
        <button
          type="button"
          className={rpBtnPrimary}
          style={{
            ...primaryBtn,
            flex: 1,
            minWidth: 0,
            minHeight: compact ? 44 : undefined,
          }}
          disabled={!canApply}
          onClick={onApplyFilters}
        >
          {labels.applyFilters}
        </button>
        <button
          type="button"
          className={rpBtnSurface}
          style={{
            ...baseBtn,
            flex: 1,
            minWidth: 0,
            minHeight: compact ? 44 : undefined,
          }}
          disabled={disabled || isFilterDefault(filter)}
          onClick={onResetFilters}
        >
          {labels.resetFilters}
        </button>
      </div>
    </div>
  );
}
