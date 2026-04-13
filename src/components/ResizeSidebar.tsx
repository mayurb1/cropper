import React, { useMemo } from "react";
import type { ImageEditorLabels } from "../types";
import { primaryBtn, inputStyle, rpBtnPrimary, rpBtnSurface } from "../styles";
import { RESIZE_PRESETS } from "../constants/resizePresets";
import {
  validateDimension,
  getUpscaleWarning,
  formatResizePreview,
  DIMENSION_MAX,
  DIMENSION_MIN,
} from "../utils/validation";
import {
  sidebarShellStyle,
  sidebarSectionLabelStyle,
  sidebarCardStyle,
} from "../editorShell.styles";

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

const hintStyle: React.CSSProperties = {
  fontSize: "var(--rp-font-size-xs)",
  color: "var(--rp-primary)",
  display: "block",
  marginTop: "var(--rp-space-1)",
  fontFamily: "var(--rp-font-family)",
};

const fieldLabelStyle: React.CSSProperties = {
  fontSize: "var(--rp-font-size-xs)",
  fontWeight: 600,
  color: "var(--rp-text-muted)",
  display: "block",
  marginBottom: "var(--rp-space-1)",
  fontFamily: "var(--rp-font-family)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
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
    baseURL && scaleW && scaleH && wValid.valid && hValid.valid;

  return (
    <div
      id="react-pixcraft-panel-resize"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-resize"
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
        }}
      >
      <div style={{ ...sidebarCardStyle, marginBottom: "var(--rp-space-4)", padding: "var(--rp-space-3)" }}>
        <div style={{ ...sidebarSectionLabelStyle, marginTop: 0 }}>
          {labels.sizePresets}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--rp-space-2)",
          }}
        >
          {RESIZE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={rpBtnSurface}
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
                padding: "8px 12px",
                border: "1px solid var(--rp-border)",
                borderRadius: 999,
                background: "var(--rp-surface)",
                color: "var(--rp-text)",
                cursor: baseURL ? "pointer" : "not-allowed",
                fontSize: "var(--rp-font-size-xs)",
                fontFamily: "var(--rp-font-family)",
                minHeight: compact ? 40 : undefined,
                opacity: baseURL ? 1 : 0.5,
                fontWeight: 500,
              }}
            >
              {p.label} {p.width}×{p.height}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...sidebarCardStyle, marginBottom: "var(--rp-space-4)", padding: "var(--rp-space-3)" }}>
        <div style={{ ...sidebarSectionLabelStyle, marginTop: 0 }}>
          {labels.outputDimensions}
        </div>
        <div style={{ marginBottom: "var(--rp-space-3)" }}>
          <label style={fieldLabelStyle}>{labels.widthPx}</label>
          <input
            type="text"
            inputMode="numeric"
            style={{
              ...inputStyle,
              width: "100%",
              borderColor: !wValid.valid ? "var(--rp-danger)" : undefined,
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
              style={{
                fontSize: "var(--rp-font-size-sm)",
                color: "var(--rp-danger)",
                display: "block",
                marginTop: "var(--rp-space-1)",
                fontFamily: "var(--rp-font-family)",
              }}
            >
              {wValid.message}
            </span>
          ) : (
            <span style={hintStyle}>
              {DIMENSION_MIN}–{DIMENSION_MAX}px
            </span>
          )}
        </div>
        <div style={{ marginBottom: "var(--rp-space-3)" }}>
          <label style={fieldLabelStyle}>{labels.heightPx}</label>
          <input
            type="text"
            inputMode="numeric"
            style={{
              ...inputStyle,
              width: "100%",
              borderColor: !hValid.valid ? "var(--rp-danger)" : undefined,
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
              style={{
                fontSize: "var(--rp-font-size-sm)",
                color: "var(--rp-danger)",
                display: "block",
                marginTop: "var(--rp-space-1)",
                fontFamily: "var(--rp-font-family)",
              }}
            >
              {hValid.message}
            </span>
          ) : (
            <span style={hintStyle}>
              {DIMENSION_MIN}–{DIMENSION_MAX}px
            </span>
          )}
        </div>
      </div>

      {upscale ? (
        <div
          style={{
            fontSize: "var(--rp-font-size-sm)",
            color: "var(--rp-warning)",
            marginBottom: "var(--rp-space-3)",
            fontFamily: "var(--rp-font-family)",
          }}
        >
          {upscale}
        </div>
      ) : null}
      {preview ? (
        <div
          style={{
            fontSize: "var(--rp-font-size-sm)",
            color: "var(--rp-text-muted)",
            marginBottom: "var(--rp-space-3)",
            fontFamily: "var(--rp-font-family)",
          }}
        >
          {preview}
        </div>
      ) : null}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--rp-space-2)",
          marginBottom: "var(--rp-space-3)",
          fontSize: "var(--rp-font-size-md)",
          color: "var(--rp-text)",
          cursor: "pointer",
          minHeight: compact ? 44 : undefined,
          fontFamily: "var(--rp-font-family)",
        }}
      >
        <input
          type="checkbox"
          checked={lockAspectRatio}
          onChange={(e) => setLockAspectRatio(e.target.checked)}
          disabled={!baseURL}
          style={{ accentColor: "var(--rp-primary)", width: 18, height: 18 }}
        />
        {labels.lockAspectRatio}
      </label>
      <div
        style={{
          fontSize: "var(--rp-font-size-sm)",
          color: "var(--rp-text-muted)",
          marginBottom: "var(--rp-space-4)",
          fontFamily: "var(--rp-font-family)",
        }}
      >
        {labels.originalDimensions}: {imgSize.width} × {imgSize.height}px
      </div>
      </div>
      <div
        style={{
          flexShrink: 0,
          paddingTop: "var(--rp-space-3)",
        }}
      >
        <button
          type="button"
          className={rpBtnPrimary}
          style={{ ...primaryBtn, width: "100%" }}
          onClick={onApplyResize}
          disabled={!canApply}
        >
          {labels.applyResize}
        </button>
      </div>
    </div>
  );
}
