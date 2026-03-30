import React, { useMemo } from "react";
import type { ImageEditorLabels } from "../types";
import { primaryBtn, inputStyle } from "../styles";
import { RESIZE_PRESETS } from "../constants/resizePresets";
import {
  validateDimension,
  getUpscaleWarning,
  formatResizePreview,
  DIMENSION_MAX,
  DIMENSION_MIN,
} from "../utils/validation";

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

/**
 * Output dimensions with presets, validation, and upscale warning.
 */
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
  compact = false,
}: ResizeSidebarProps) {
  const wNum = parseInt(scaleW || "0", 10);
  const hNum = parseInt(scaleH || "0", 10);
  const wValid = scaleW === "" ? { valid: true } : validateDimension(wNum);
  const hValid = scaleH === "" ? { valid: true } : validateDimension(hNum);
  const upscale = useMemo(() => {
    if (!wNum || !hNum || !wValid.valid || !hValid.valid) return undefined;
    return getUpscaleWarning(wNum, hNum, imgSize.width, imgSize.height);
  }, [wNum, hNum, wValid.valid, hValid.valid, imgSize.width, imgSize.height]);

  const preview = useMemo(() => {
    if (!wNum || !hNum || !wValid.valid || !hValid.valid) return "";
    return formatResizePreview(imgSize.width, imgSize.height, wNum, hNum);
  }, [wNum, hNum, wValid.valid, hValid.valid, imgSize.width, imgSize.height]);

  const canApply =
    baseURL &&
    scaleW &&
    scaleH &&
    wValid.valid &&
    hValid.valid;

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
        {labels.sizePresets}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginBottom: 16,
          maxHeight: 120,
          overflowY: "auto",
        }}
      >
        {RESIZE_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={!baseURL}
            onClick={() => {
              setScaleW(String(p.width));
              setScaleH(String(p.height));
              if (
                lockAspectRatio &&
                originalAspectRatio &&
                Math.abs(p.width / p.height - originalAspectRatio) > 0.02
              ) {
                setLockAspectRatio(false);
              }
            }}
            style={{
              padding: "6px 10px",
              border: "1px solid var(--rp-border)",
              borderRadius: 6,
              background: "var(--rp-input-bg)",
              color: "var(--rp-text)",
              cursor: baseURL ? "pointer" : "not-allowed",
              fontSize: 11,
              minHeight: compact ? 40 : undefined,
              opacity: baseURL ? 1 : 0.5,
            }}
          >
            {p.label} {p.width}×{p.height}
          </button>
        ))}
      </div>
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
          inputMode="numeric"
          style={{
            ...inputStyle,
            width: "100%",
            borderColor: !wValid.valid ? "#d32f2f" : undefined,
          }}
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
          aria-invalid={!wValid.valid}
          aria-describedby="rp-resize-w-hint"
        />
        {!wValid.valid && wValid.message ? (
          <span
            id="rp-resize-w-hint"
            style={{ fontSize: 12, color: "#d32f2f", display: "block", marginTop: 4 }}
          >
            {wValid.message}
          </span>
        ) : (
          <span
            style={{
              fontSize: 10,
              color: "var(--rp-text-muted)",
              display: "block",
              marginTop: 2,
            }}
          >
            {DIMENSION_MIN}–{DIMENSION_MAX}px
          </span>
        )}
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
          inputMode="numeric"
          style={{
            ...inputStyle,
            width: "100%",
            borderColor: !hValid.valid ? "#d32f2f" : undefined,
          }}
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
          aria-invalid={!hValid.valid}
        />
        {!hValid.valid && hValid.message ? (
          <span
            style={{ fontSize: 12, color: "#d32f2f", display: "block", marginTop: 4 }}
          >
            {hValid.message}
          </span>
        ) : (
          <span
            style={{
              fontSize: 10,
              color: "var(--rp-text-muted)",
              display: "block",
              marginTop: 2,
            }}
          >
            {DIMENSION_MIN}–{DIMENSION_MAX}px
          </span>
        )}
      </div>
      {upscale ? (
        <div
          style={{
            fontSize: 12,
            color: "#b45309",
            marginBottom: 12,
          }}
        >
          {upscale}
        </div>
      ) : null}
      {preview ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--rp-text-muted)",
            marginBottom: 12,
          }}
        >
          {preview}
        </div>
      ) : null}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          fontSize: 13,
          color: "var(--rp-text)",
          cursor: "pointer",
          minHeight: compact ? 44 : undefined,
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
        style={{ ...primaryBtn, marginTop: "auto" }}
        onClick={onApplyResize}
        disabled={!canApply}
      >
        {labels.applyResize}
      </button>
    </div>
  );
}
