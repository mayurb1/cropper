import React from "react";
import type { ImageEditorLabels } from "../types";
import type { CropRect } from "../types";
import type { Viewport } from "../types";
import { ASPECT_PRESETS } from "../constants";
import { getCropRectNormalized, clampRectToViewport } from "../utils/crop";
import { baseBtn, primaryBtn, inputStyle } from "../styles";

export interface CropSidebarProps {
  cropModeType: "free" | "fixed";
  setCropModeType: (t: "free" | "fixed") => void;
  setCropModeTypeAndAspect: (t: "free" | "fixed") => void;
  aspect: number | undefined;
  setAspect: (a: number | undefined) => void;
  cropRect: CropRect | null;
  setCropRect: (r: CropRect | null) => void;
  viewport: Viewport;
  onApplyCrop: () => void;
  onClearCrop: () => void;
  labels: ImageEditorLabels;
  baseURL: string | null;
  /** Current rotation in degrees (0–359) for display */
  rotationDeg: number;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRotate180: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  transformDisabled?: boolean;
  /** Larger tap targets when layout is compact */
  compact?: boolean;
}

const SIDEBAR_STYLE: React.CSSProperties = {
  flex: "0 0 320px",
  maxWidth: "100%",
  minHeight: 0,
  maxHeight: "100%",
  overflowY: "auto",
  padding: 16,
  background: "var(--rp-surface)",
  border: "1px solid var(--rp-border)",
  borderRadius: 12,
  minWidth: 280,
  display: "flex",
  flexDirection: "column",
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--rp-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 8,
};

const ICON_BTN = (compact: boolean): React.CSSProperties => ({
  minWidth: compact ? 44 : 40,
  minHeight: compact ? 44 : 36,
  padding: compact ? 10 : 8,
  border: "1px solid var(--rp-border)",
  borderRadius: 8,
  background: "var(--rp-input-bg)",
  color: "var(--rp-text)",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

export function CropSidebar({
  cropModeType,
  setCropModeTypeAndAspect,
  aspect,
  setAspect,
  cropRect,
  setCropRect,
  viewport,
  onApplyCrop,
  onClearCrop,
  labels,
  baseURL,
  setCropModeType,
  rotationDeg,
  onRotateLeft,
  onRotateRight,
  onRotate180,
  onFlipHorizontal,
  onFlipVertical,
  transformDisabled = false,
  compact = false,
}: CropSidebarProps) {
  const r =
    cropRect && (cropRect.width !== 0 || cropRect.height !== 0)
      ? getCropRectNormalized(cropRect)
      : null;

  const disabledTransform = transformDisabled || !baseURL;
  const ib = ICON_BTN(compact);

  const updateRect = (key: keyof CropRect, value: string) => {
    const n = parseInt(String(value).replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return;
    const next = r
      ? { ...r }
      : { x: 0, y: 0, width: viewport.w, height: viewport.h };
    next[key] = key === "x" || key === "y" ? n : Math.max(1, n);
    setCropRect(clampRectToViewport(next, viewport));
  };

  const maxW = viewport.w;
  const maxH = viewport.h;

  return (
    <div
      id="react-pixcraft-panel-crop"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-crop"
      style={SIDEBAR_STYLE}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={SECTION_LABEL_STYLE}>{labels.rotation}</div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <button
            type="button"
            style={{ ...ib, opacity: disabledTransform ? 0.5 : 1 }}
            onClick={onRotateLeft}
            disabled={disabledTransform}
            aria-label={labels.rotateLeft}
            title={labels.rotateLeft}
          >
            ↺
          </button>
          <button
            type="button"
            style={{ ...ib, opacity: disabledTransform ? 0.5 : 1 }}
            onClick={onRotateRight}
            disabled={disabledTransform}
            aria-label={labels.rotateRight}
            title={labels.rotateRight}
          >
            ↻
          </button>
          <button
            type="button"
            style={{ ...ib, opacity: disabledTransform ? 0.5 : 1 }}
            onClick={onRotate180}
            disabled={disabledTransform}
            aria-label={labels.rotate180}
            title={labels.rotate180}
          >
            ⟲
          </button>
          <button
            type="button"
            style={{ ...ib, opacity: disabledTransform ? 0.5 : 1 }}
            onClick={onFlipHorizontal}
            disabled={disabledTransform}
            aria-label={labels.flipHorizontal}
            title={labels.flipHorizontal}
          >
            ↔
          </button>
          <button
            type="button"
            style={{ ...ib, opacity: disabledTransform ? 0.5 : 1 }}
            onClick={onFlipVertical}
            disabled={disabledTransform}
            aria-label={labels.flipVertical}
            title={labels.flipVertical}
          >
            ↕
          </button>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--rp-text-muted)",
          }}
        >
          {labels.currentAngle}: {rotationDeg}°
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={SECTION_LABEL_STYLE}>{labels.cropMode}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setCropModeTypeAndAspect("free")}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid var(--rp-border)",
              borderRadius: 6,
              background:
                cropModeType === "free"
                  ? "var(--rp-primary)"
                  : "var(--rp-input-bg)",
              color: cropModeType === "free" ? "white" : "var(--rp-text)",
              cursor: "pointer",
              fontSize: 13,
              minHeight: compact ? 44 : undefined,
            }}
          >
            {labels.cropModeFree}
          </button>
          <button
            type="button"
            onClick={() => setCropModeTypeAndAspect("fixed")}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid var(--rp-border)",
              borderRadius: 6,
              background:
                cropModeType === "fixed"
                  ? "var(--rp-primary)"
                  : "var(--rp-input-bg)",
              color: cropModeType === "fixed" ? "white" : "var(--rp-text)",
              cursor: "pointer",
              fontSize: 13,
              minHeight: compact ? 44 : undefined,
            }}
          >
            {labels.cropModeFixed}
          </button>
        </div>
      </div>
      {cropModeType === "fixed" ? (
        <div style={{ marginBottom: 16 }}>
          <div style={SECTION_LABEL_STYLE}>{labels.aspectRatio}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ASPECT_PRESETS.map((preset) => {
              const isSelected =
                aspect !== undefined && Math.abs(aspect - preset.value) < 1e-6;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCropModeType("fixed");
                    setAspect(preset.value);
                  }}
                  style={{
                    padding: "6px 10px",
                    border: `1px solid ${isSelected ? "var(--rp-primary)" : "var(--rp-border)"}`,
                    borderRadius: 6,
                    background: isSelected
                      ? "var(--rp-surface)"
                      : "var(--rp-input-bg)",
                    color: "var(--rp-text)",
                    cursor: "pointer",
                    fontSize: 12,
                    minHeight: compact ? 40 : undefined,
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div style={{ marginBottom: 16, flex: 1 }}>
        <div style={SECTION_LABEL_STYLE}>{labels.selection}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--rp-text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              X
            </label>
            <input
              type="text"
              inputMode="numeric"
              style={{ ...inputStyle, width: "100%" }}
              value={r ? Math.round(r.x) : ""}
              onChange={(e) => updateRect("x", e.target.value)}
              placeholder="0"
              disabled={!baseURL}
              aria-invalid={r !== null && (r.x < 0 || r.x > maxW)}
            />
            <span
              style={{
                fontSize: 10,
                color: "var(--rp-text-muted)",
                display: "block",
                marginTop: 2,
              }}
            >
              Max: {maxW}px
            </span>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--rp-text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Y
            </label>
            <input
              type="text"
              inputMode="numeric"
              style={{ ...inputStyle, width: "100%" }}
              value={r ? Math.round(r.y) : ""}
              onChange={(e) => updateRect("y", e.target.value)}
              placeholder="0"
              disabled={!baseURL}
            />
            <span
              style={{
                fontSize: 10,
                color: "var(--rp-text-muted)",
                display: "block",
                marginTop: 2,
              }}
            >
              Max: {maxH}px
            </span>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--rp-text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              W
            </label>
            <input
              type="text"
              inputMode="numeric"
              style={{ ...inputStyle, width: "100%" }}
              value={r ? Math.round(r.width) : ""}
              onChange={(e) => updateRect("width", e.target.value)}
              placeholder="px"
              disabled={!baseURL}
            />
            <span
              style={{
                fontSize: 10,
                color: "var(--rp-text-muted)",
                display: "block",
                marginTop: 2,
              }}
            >
              Max: {maxW}px
            </span>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                color: "var(--rp-text-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              H
            </label>
            <input
              type="text"
              inputMode="numeric"
              style={{ ...inputStyle, width: "100%" }}
              value={r ? Math.round(r.height) : ""}
              onChange={(e) => updateRect("height", e.target.value)}
              placeholder="px"
              disabled={!baseURL}
            />
            <span
              style={{
                fontSize: 10,
                color: "var(--rp-text-muted)",
                display: "block",
                marginTop: 2,
              }}
            >
              Max: {maxH}px
            </span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
        <button
          type="button"
          style={primaryBtn}
          onClick={onApplyCrop}
          disabled={
            !cropRect || (cropRect.width === 0 && cropRect.height === 0)
          }
        >
          {labels.applyCrop}
        </button>
        <button type="button" style={baseBtn} onClick={onClearCrop}>
          {labels.discard}
        </button>
      </div>
    </div>
  );
}
