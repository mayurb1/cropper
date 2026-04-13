import React from "react";
import type { ImageEditorLabels } from "../../types";
import type { CropRect } from "../../types";
import { ASPECT_PRESETS } from "../../constants";
import { getCropRectNormalized } from "../../utils/crop";
import {
  baseBtn,
  primaryBtn,
  rpBtnPrimary,
  rpBtnSurface,
} from "../../styles";
import {
  sidebarShellStyle,
  sidebarSectionLabelStyle,
  sidebarCardStyle,
} from "../../editorShell.styles";

export interface CropSidebarProps {
  cropModeType: "free" | "fixed";
  setCropModeTypeAndAspect: (t: "free" | "fixed") => void;
  aspect: number | undefined;
  setAspect: (a: number | undefined) => void;
  cropRect: CropRect | null;
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

const ICON_BTN = (compact: boolean): React.CSSProperties => ({
  minWidth: compact ? 44 : 40,
  minHeight: compact ? 44 : 36,
  padding: compact ? 10 : 8,
  border: "1px solid var(--rp-border)",
  borderRadius: "var(--rp-radius-sm)",
  background: "var(--rp-surface)",
  color: "var(--rp-text)",
  cursor: "pointer",
  fontSize: 16,
  lineHeight: 1,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "var(--rp-font-family)",
});

const SELECTION_CARD_HEADER_STYLE: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: "var(--rp-font-size-sm)",
  fontWeight: 600,
  color: "var(--rp-text)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--rp-border)",
  background: "var(--rp-surface)",
  fontFamily: "var(--rp-font-family)",
};

const SELECTION_ICON_CELL_STYLE: React.CSSProperties = {
  flex: "0 0 auto",
  width: 32,
  height: 32,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const SELECTION_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  fontSize: "var(--rp-font-size-sm)",
  lineHeight: 1.35,
  fontFamily: "var(--rp-font-family)",
  background: "var(--rp-surface-muted)",
};

const SELECTION_ROW_LABEL_STYLE: React.CSSProperties = {
  color: "var(--rp-text-muted)",
  fontSize: "var(--rp-font-size-sm)",
  flex: "1 1 auto",
  minWidth: 0,
  fontFamily: "var(--rp-font-family)",
};

const SELECTION_ROW_VALUE_STYLE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "baseline",
  justifyContent: "flex-end",
  gap: 4,
  fontVariantNumeric: "tabular-nums",
  color: "var(--rp-text)",
  flex: "0 0 auto",
  textAlign: "right",
};

const SELECTION_VALUE_NUM_STYLE: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "var(--rp-font-size-md)",
};

const SELECTION_VALUE_UNIT_STYLE: React.CSSProperties = {
  fontWeight: 500,
  fontSize: "var(--rp-font-size-xs)",
  color: "var(--rp-text-muted)",
  letterSpacing: "0.02em",
};

const SELECTION_DIVIDER_STYLE: React.CSSProperties = {
  height: 1,
  margin: 0,
  background: "var(--rp-border)",
};

const ROTATION_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--rp-space-2)",
  marginBottom: "var(--rp-space-2)",
};

const MODE_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  gap: "var(--rp-space-2)",
};

const PRESET_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const FOOTER_ACTIONS_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  flexShrink: 0,
  gap: "var(--rp-space-2)",
  width: "100%",
};

function SelectionMetricIcon({
  kind,
  compact,
}: {
  kind: "x" | "y" | "w" | "h";
  compact: boolean;
}) {
  const size = compact ? 20 : 22;
  const stroke = "var(--rp-primary)";
  const fill = "var(--rp-primary)";
  const sw = 1.75;

  switch (kind) {
    case "x":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <rect x="8" y="10" width="8" height="8" rx="1.5" fill={fill} />
        </svg>
      );
    case "y":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <line
            x1="5"
            y1="6.5"
            x2="19"
            y2="6.5"
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray="3 2.5"
            strokeLinecap="round"
          />
          <rect x="9" y="9.5" width="6" height="10" rx="1.5" fill={fill} />
        </svg>
      );
    case "w":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden
          fill="none"
        >
          <path
            d="M5 12h14M2 12l3.5-3M2 12l3.5 3M22 12l-3.5-3M22 12l-3.5 3"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "h":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden
          fill="none"
        >
          <path
            d="M12 5v14M12 2l-3 3.5M12 2l3 3.5M12 22l-3-3.5M12 22l3-3.5"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/**
 * Crop mode sidebar: rotation/flip, aspect presets, selection size (read-only), apply/clear.
 * @example
 * ```tsx
 * <CropSidebar cropModeType="free" setCropModeTypeAndAspect={fn} ... />
 * ```
 */
export const CropSidebar = React.memo(function CropSidebar({
  cropModeType,
  setCropModeTypeAndAspect,
  aspect,
  setAspect,
  cropRect,
  onApplyCrop,
  onClearCrop,
  labels,
  baseURL,
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

  const selectionRow = (extra?: React.CSSProperties): React.CSSProperties => ({
    ...SELECTION_ROW_STYLE,
    padding: compact ? "8px 10px" : "10px 12px",
    ...extra,
  });

  const iconCellStyle: React.CSSProperties = {
    ...SELECTION_ICON_CELL_STYLE,
    width: compact ? 28 : 32,
    height: compact ? 28 : 32,
  };

  const formatPx = (n: number | undefined) =>
    n !== undefined ? (
      <span style={SELECTION_ROW_VALUE_STYLE}>
        <span style={SELECTION_VALUE_NUM_STYLE}>{Math.round(n)}</span>
        <span style={SELECTION_VALUE_UNIT_STYLE}>px</span>
      </span>
    ) : (
      <span style={SELECTION_ROW_VALUE_STYLE}>
        <span style={SELECTION_VALUE_NUM_STYLE}>—</span>
      </span>
    );

  const segmentedBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "10px 12px",
    border: "1px solid var(--rp-border)",
    borderRadius: "var(--rp-radius-sm)",
    background: active ? "var(--rp-primary)" : "var(--rp-surface)",
    color: active ? "#ffffff" : "var(--rp-text)",
    cursor: "pointer",
    fontSize: "var(--rp-font-size-sm)",
    fontWeight: 600,
    fontFamily: "var(--rp-font-family)",
    minHeight: compact ? 44 : undefined,
    boxShadow: active
      ? "0 1px 2px color-mix(in srgb, var(--rp-primary) 35%, transparent)"
      : "none",
  });

  return (
    <div
      id="react-pixcraft-panel-crop"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-crop"
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
      <div style={{ marginBottom: "var(--rp-space-4)" }}>
        <div style={sidebarSectionLabelStyle}>{labels.rotation}</div>
        <div style={ROTATION_ROW_STYLE}>
          <button
            type="button"
            className={rpBtnSurface}
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
            className={rpBtnSurface}
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
            className={rpBtnSurface}
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
            className={rpBtnSurface}
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
            className={rpBtnSurface}
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
            fontSize: "var(--rp-font-size-sm)",
            color: "var(--rp-text-muted)",
            fontFamily: "var(--rp-font-family)",
          }}
        >
          {labels.currentAngle}: {rotationDeg}°
        </div>
      </div>

      <div style={{ marginBottom: "var(--rp-space-4)" }}>
        <div style={sidebarSectionLabelStyle}>{labels.cropMode}</div>
        <div style={MODE_ROW_STYLE}>
          <button
            type="button"
            onClick={() => setCropModeTypeAndAspect("free")}
            style={segmentedBtn(cropModeType === "free")}
          >
            {labels.cropModeFree}
          </button>
          <button
            type="button"
            onClick={() => setCropModeTypeAndAspect("fixed")}
            style={segmentedBtn(cropModeType === "fixed")}
          >
            {labels.cropModeFixed}
          </button>
        </div>
      </div>
      {cropModeType === "fixed" ? (
        <div style={{ marginBottom: "var(--rp-space-4)" }}>
          <div style={sidebarSectionLabelStyle}>{labels.aspectRatio}</div>
          <div style={PRESET_ROW_STYLE}>
            {ASPECT_PRESETS.map((preset) => {
              const isSelected =
                aspect !== undefined && Math.abs(aspect - preset.value) < 1e-6;
              return (
                <button
                  key={preset.label}
                  type="button"
                  className={rpBtnSurface}
                  onClick={() => {
                    setCropModeTypeAndAspect("fixed");
                    setAspect(preset.value);
                  }}
                  style={{
                    padding: "8px 12px",
                    border: `1px solid ${isSelected ? "var(--rp-primary)" : "var(--rp-border)"}`,
                    borderRadius: 999,
                    background: isSelected
                      ? "color-mix(in srgb, var(--rp-primary) 12%, var(--rp-surface))"
                      : "var(--rp-surface)",
                    color: "var(--rp-text)",
                    cursor: "pointer",
                    fontSize: "var(--rp-font-size-xs)",
                    fontFamily: "var(--rp-font-family)",
                    minHeight: compact ? 40 : undefined,
                    fontWeight: isSelected ? 600 : 500,
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <div style={{ marginBottom: "var(--rp-space-4)" }}>
        <div
          style={{
            ...sidebarCardStyle,
            opacity: !baseURL ? 0.55 : 1,
          }}
          aria-live="polite"
        >
          <div style={SELECTION_CARD_HEADER_STYLE}>
            {labels.selection ?? "Selection"}
          </div>
          <div
            style={selectionRow({
              borderBottom: "1px solid var(--rp-border)",
            })}
          >
            <span style={iconCellStyle}>
              <SelectionMetricIcon kind="x" compact={compact} />
            </span>
            <span style={SELECTION_ROW_LABEL_STYLE}>
              {labels.cropFromLeft ?? "X (From left)"}
            </span>
            {formatPx(r?.x)}
          </div>
          <div style={selectionRow()}>
            <span style={iconCellStyle}>
              <SelectionMetricIcon kind="y" compact={compact} />
            </span>
            <span style={SELECTION_ROW_LABEL_STYLE}>
              {labels.cropFromTop ?? "Y (From top)"}
            </span>
            {formatPx(r?.y)}
          </div>
          <div style={SELECTION_DIVIDER_STYLE} role="presentation" />
          <div
            style={selectionRow({
              borderBottom: "1px solid var(--rp-border)",
            })}
          >
            <span style={iconCellStyle}>
              <SelectionMetricIcon kind="w" compact={compact} />
            </span>
            <span style={SELECTION_ROW_LABEL_STYLE}>
              {labels.width ?? "Width"}
            </span>
            {formatPx(r?.width)}
          </div>
          <div style={selectionRow()}>
            <span style={iconCellStyle}>
              <SelectionMetricIcon kind="h" compact={compact} />
            </span>
            <span style={SELECTION_ROW_LABEL_STYLE}>
              {labels.height ?? "Height"}
            </span>
            {formatPx(r?.height)}
          </div>
        </div>
      </div>
      </div>
      <div
        style={{
          ...FOOTER_ACTIONS_STYLE,
          paddingTop: "var(--rp-space-3)",
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
          onClick={onApplyCrop}
          disabled={
            !cropRect || (cropRect.width === 0 && cropRect.height === 0)
          }
        >
          {labels.applyCrop}
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
          onClick={onClearCrop}
        >
          {labels.discard}
        </button>
      </div>
    </div>
  );
});
