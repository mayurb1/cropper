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
}

const SIDEBAR_STYLE: React.CSSProperties = {
  flex: "0 0 240px",
  padding: 16,
  background: "var(--rp-surface)",
  border: "1px solid var(--rp-border)",
  borderRadius: 12,
  minWidth: 200,
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--rp-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 8,
};

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
}: CropSidebarProps) {
  const r =
    cropRect && (cropRect.width !== 0 || cropRect.height !== 0)
      ? getCropRectNormalized(cropRect)
      : null;

  const updateRect = (key: keyof CropRect, value: string) => {
    const n = parseInt(String(value).replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return;
    const next = r
      ? { ...r }
      : { x: 0, y: 0, width: viewport.w, height: viewport.h };
    next[key] = key === "x" || key === "y" ? n : Math.max(1, n);
    setCropRect(clampRectToViewport(next, viewport));
  };

  return (
    <div
      id="react-pixcraft-panel-crop"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-crop"
      style={SIDEBAR_STYLE}
    >
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
                cropModeType === "free" ? "var(--rp-primary)" : "var(--rp-input-bg)",
              color: cropModeType === "free" ? "white" : "var(--rp-text)",
              cursor: "pointer",
              fontSize: 13,
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
                cropModeType === "fixed" ? "var(--rp-primary)" : "var(--rp-input-bg)",
              color: cropModeType === "fixed" ? "white" : "var(--rp-text)",
              cursor: "pointer",
              fontSize: 13,
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
                    background: isSelected ? "var(--rp-surface)" : "var(--rp-input-bg)",
                    color: "var(--rp-text)",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div style={{ marginBottom: 16 }}>
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
              style={{ ...inputStyle, width: "100%" }}
              value={r ? Math.round(r.x) : ""}
              onChange={(e) => updateRect("x", e.target.value)}
              placeholder="0"
              disabled={!baseURL}
            />
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
              style={{ ...inputStyle, width: "100%" }}
              value={r ? Math.round(r.y) : ""}
              onChange={(e) => updateRect("y", e.target.value)}
              placeholder="0"
              disabled={!baseURL}
            />
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
              style={{ ...inputStyle, width: "100%" }}
              value={r ? Math.round(r.width) : ""}
              onChange={(e) => updateRect("width", e.target.value)}
              placeholder="px"
              disabled={!baseURL}
            />
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
              style={{ ...inputStyle, width: "100%" }}
              value={r ? Math.round(r.height) : ""}
              onChange={(e) => updateRect("height", e.target.value)}
              placeholder="px"
              disabled={!baseURL}
            />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
