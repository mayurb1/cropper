import React from "react";
import type { ImageEditorLabels } from "../types";
import { primaryBtn, inputStyle } from "../styles";

export interface ResizeSidebarProps {
  scaleW: string;
  setScaleW: (v: string) => void;
  scaleH: string;
  setScaleH: (v: string) => void;
  lockAspectRatio: boolean;
  setLockAspectRatio: (v: boolean) => void;
  originalAspectRatio: number | null;
  imgSize: { width: number; height: number };
  onApplyResize: () => void;
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

export function ResizeSidebar({
  scaleW,
  setScaleW,
  scaleH,
  setScaleH,
  lockAspectRatio,
  setLockAspectRatio,
  originalAspectRatio,
  imgSize,
  onApplyResize,
  labels,
  baseURL,
}: ResizeSidebarProps) {
  return (
    <div
      id="react-pixcraft-panel-resize"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-resize"
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
        {labels.outputDimensions}
      </div>
      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            fontSize: 11,
            color: "var(--rp-text-muted)",
            display: "block",
            marginBottom: 4,
          }}
        >
          {labels.widthPx}
        </label>
        <input
          type="text"
          style={{ ...inputStyle, width: "100%" }}
          value={scaleW}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            setScaleW(value);
            if (lockAspectRatio && value && (originalAspectRatio ?? 0) > 0) {
              const w = parseInt(value, 10);
              if (!Number.isNaN(w) && w > 0)
                setScaleH(String(Math.round(w / originalAspectRatio!)));
            } else if (!value) setScaleH("");
          }}
          placeholder="px"
          disabled={!baseURL}
        />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            fontSize: 11,
            color: "var(--rp-text-muted)",
            display: "block",
            marginBottom: 4,
          }}
        >
          {labels.heightPx}
        </label>
        <input
          type="text"
          style={{ ...inputStyle, width: "100%" }}
          value={scaleH}
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            setScaleH(value);
            if (lockAspectRatio && value && (originalAspectRatio ?? 0) > 0) {
              const h = parseInt(value, 10);
              if (!Number.isNaN(h) && h > 0)
                setScaleW(String(Math.round(h * originalAspectRatio!)));
            } else if (!value) setScaleW("");
          }}
          placeholder="px"
          disabled={!baseURL}
        />
      </div>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          fontSize: 13,
          color: "var(--rp-text)",
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={lockAspectRatio}
          onChange={(e) => setLockAspectRatio(e.target.checked)}
          disabled={!baseURL}
        />
        {labels.lockAspectRatio}
      </label>
      <div
        style={{
          fontSize: 12,
          color: "var(--rp-text-muted)",
          marginBottom: 16,
        }}
      >
        {labels.originalDimensions}: {imgSize.width} × {imgSize.height}px
      </div>
      <button
        type="button"
        style={primaryBtn}
        onClick={onApplyResize}
        disabled={!baseURL || !scaleW || !scaleH}
      >
        {labels.applyResize}
      </button>
    </div>
  );
}
