import React, { useMemo } from "react";
import type { ImageEditorLabels } from "../types";
import { primaryBtn, rpBtnPrimary, rpBtnSurface } from "../styles";
import { estimateRgbSizeKb } from "../utils/validation";
import {
  sidebarShellStyle,
  sidebarSectionLabelStyle,
  sidebarCardStyle,
} from "../ImageEditor.styles";

export interface ScaleSidebarProps {
  scaleFactorPercent: number;
  setScaleFactorPercent: (v: number) => void;
  imgSize: { width: number; height: number };
  onApplyScale: () => void;
  labels: ImageEditorLabels;
  baseURL: string | null;
  compact?: boolean;
}

const SCALE_PRESETS = [25, 50, 75, 100, 125, 150, 175, 200];

/**
 * Uniform scale by percentage with estimated output size.
 */
export function ScaleSidebar({
  scaleFactorPercent,
  setScaleFactorPercent,
  imgSize,
  onApplyScale,
  labels,
  baseURL,
  compact = false,
}: ScaleSidebarProps) {
  const outW =
    imgSize.width > 0
      ? Math.round((imgSize.width * scaleFactorPercent) / 100)
      : 0;
  const outH =
    imgSize.height > 0
      ? Math.round((imgSize.height * scaleFactorPercent) / 100)
      : 0;
  const estKb = useMemo(
    () => estimateRgbSizeKb(outW, outH),
    [outW, outH]
  );

  return (
    <div
      id="react-pixcraft-panel-scale"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-scale"
      style={sidebarShellStyle}
    >
      <div style={sidebarSectionLabelStyle}>{labels.scaleFactor}</div>
      <div
        style={{
          ...sidebarCardStyle,
          marginBottom: "var(--rp-space-4)",
          padding: "var(--rp-space-4)",
          textAlign: "center",
          background: "var(--rp-surface-muted)",
        }}
      >
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "var(--rp-primary)",
            fontFamily: "var(--rp-font-family)",
            letterSpacing: "-0.02em",
          }}
        >
          {scaleFactorPercent} %
        </span>
      </div>
      <div style={{ marginBottom: "var(--rp-space-2)" }}>
        <input
          type="range"
          min={10}
          max={200}
          value={scaleFactorPercent}
          onChange={(e) => setScaleFactorPercent(Number(e.target.value))}
          disabled={!baseURL}
          style={{
            width: "100%",
            accentColor: "var(--rp-primary)",
            height: 6,
            borderRadius: 999,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "var(--rp-font-size-xs)",
          color: "var(--rp-text-muted)",
          marginBottom: "var(--rp-space-3)",
          fontFamily: "var(--rp-font-family)",
        }}
      >
        <span>10%</span>
        <span>200%</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "var(--rp-space-2)",
          marginBottom: "var(--rp-space-4)",
        }}
      >
        {SCALE_PRESETS.map((pct) => (
          <button
            key={pct}
            type="button"
            className={rpBtnSurface}
            onClick={() => setScaleFactorPercent(pct)}
            disabled={!baseURL}
            style={{
              padding: "8px 6px",
              border: `1px solid ${scaleFactorPercent === pct ? "var(--rp-primary)" : "var(--rp-border)"}`,
              borderRadius: 999,
              background:
                scaleFactorPercent === pct
                  ? "var(--rp-primary)"
                  : "var(--rp-surface)",
              color: scaleFactorPercent === pct ? "#ffffff" : "var(--rp-text)",
              cursor: baseURL ? "pointer" : "not-allowed",
              fontSize: "var(--rp-font-size-xs)",
              fontFamily: "var(--rp-font-family)",
              minHeight: compact ? 40 : 36,
              fontWeight: scaleFactorPercent === pct ? 600 : 500,
            }}
          >
            {pct}%
          </button>
        ))}
      </div>
      <div
        style={{
          fontSize: "var(--rp-font-size-sm)",
          color: "var(--rp-text-muted)",
          marginBottom: "var(--rp-space-2)",
          fontFamily: "var(--rp-font-family)",
        }}
      >
        {imgSize.width > 0 && imgSize.height > 0
          ? `${outW} × ${outH}px`
          : "—"}
      </div>
      <div
        style={{
          fontSize: "var(--rp-font-size-sm)",
          color: "var(--rp-text-muted)",
          marginBottom: "var(--rp-space-4)",
          fontFamily: "var(--rp-font-family)",
        }}
      >
        {labels.estimatedSize}: ~{estKb} KB (RGB estimate)
      </div>
      <button
        type="button"
        className={rpBtnPrimary}
        style={{ ...primaryBtn, marginTop: "auto" }}
        onClick={onApplyScale}
        disabled={!baseURL}
      >
        {labels.applyScale}
      </button>
    </div>
  );
}
