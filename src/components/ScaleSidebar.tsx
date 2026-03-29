import React, { useMemo } from "react";
import type { ImageEditorLabels } from "../types";
import { primaryBtn } from "../styles";
import { estimateRgbSizeKb } from "../utils/validation";

export interface ScaleSidebarProps {
  scaleFactorPercent: number;
  setScaleFactorPercent: (v: number) => void;
  imgSize: { width: number; height: number };
  onApplyScale: () => void;
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
};

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
      style={SIDEBAR_STYLE}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--rp-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 12,
        }}
      >
        {labels.scaleFactor}
      </div>
      <div
        style={{
          marginBottom: 16,
          padding: "12px 16px",
          background: "var(--rp-input-bg)",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "var(--rp-primary)",
          }}
        >
          {scaleFactorPercent} %
        </span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="range"
          min={10}
          max={200}
          value={scaleFactorPercent}
          onChange={(e) => setScaleFactorPercent(Number(e.target.value))}
          disabled={!baseURL}
          style={{ width: "100%", accentColor: "var(--rp-primary)" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "var(--rp-text-muted)",
          marginBottom: 12,
        }}
      >
        <span>10%</span>
        <span>200%</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {SCALE_PRESETS.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => setScaleFactorPercent(pct)}
            disabled={!baseURL}
            style={{
              padding: "6px 10px",
              border: `1px solid ${scaleFactorPercent === pct ? "var(--rp-primary)" : "var(--rp-border)"}`,
              borderRadius: 6,
              background:
                scaleFactorPercent === pct
                  ? "var(--rp-primary)"
                  : "var(--rp-input-bg)",
              color: scaleFactorPercent === pct ? "white" : "var(--rp-text)",
              cursor: baseURL ? "pointer" : "not-allowed",
              fontSize: 12,
              minHeight: compact ? 40 : undefined,
            }}
          >
            {pct}%
          </button>
        ))}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--rp-text-muted)",
          marginBottom: 8,
        }}
      >
        ←{" "}
        {imgSize.width > 0 && imgSize.height > 0
          ? `${outW} × ${outH}px`
          : "—"}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--rp-text-muted)",
          marginBottom: 16,
        }}
      >
        {labels.estimatedSize}: ~{estKb} KB (RGB estimate)
      </div>
      <button
        type="button"
        style={{ ...primaryBtn, marginTop: "auto" }}
        onClick={onApplyScale}
        disabled={!baseURL}
      >
        {labels.applyScale}
      </button>
    </div>
  );
}
