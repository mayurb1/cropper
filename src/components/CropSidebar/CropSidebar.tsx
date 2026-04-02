import React from "react";
import type { ImageEditorLabels } from "../../types";
import type { CropRect } from "../../types";
import { ASPECT_PRESETS } from "../../constants";
import { getCropRectNormalized } from "../../utils/crop";
import { baseBtn, primaryBtn } from "../../styles";

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

const SELECTION_PANEL_STYLE: React.CSSProperties = {
  border: "1px solid var(--rp-border)",
  borderRadius: 8,
  background: "var(--rp-surface)",
  overflow: "hidden",
};

const SELECTION_CARD_HEADER_STYLE: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: 13,
  fontWeight: 600,
  color: "var(--rp-text)",
  letterSpacing: "0.02em",
  borderBottom: "1px solid var(--rp-border)",
  background: "color-mix(in srgb, var(--rp-primary) 12%, var(--rp-surface))",
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
  fontSize: 13,
  lineHeight: 1.35,
};

const SELECTION_ROW_LABEL_STYLE: React.CSSProperties = {
  color: "var(--rp-text-muted)",
  fontSize: 13,
  flex: "1 1 auto",
  minWidth: 0,
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
  fontSize: 14,
};

const SELECTION_VALUE_UNIT_STYLE: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 11,
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
  gap: 8,
  marginBottom: 8,
};

const MODE_ROW_STYLE: React.CSSProperties = { display: "flex", gap: 8 };

const PRESET_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const FOOTER_ACTIONS_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  marginTop: "auto",
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
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden
        >
          <rect x="8" y="10" width="8" height="8" rx="1.5" fill={fill} />
        </svg>
      );
    case "y":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden
        >
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

  return (
    <div
      id="react-pixcraft-panel-crop"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-crop"
      style={SIDEBAR_STYLE}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={SECTION_LABEL_STYLE}>{labels.rotation}</div>
        <div style={ROTATION_ROW_STYLE}>
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
        <div style={MODE_ROW_STYLE}>
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
          <div style={PRESET_ROW_STYLE}>
            {ASPECT_PRESETS.map((preset) => {
              const isSelected =
                aspect !== undefined && Math.abs(aspect - preset.value) < 1e-6;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCropModeTypeAndAspect("fixed");
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
        <div
          style={{
            ...SELECTION_PANEL_STYLE,
            opacity: !baseURL ? 0.55 : 1,
          }}
          aria-live="polite"
        >
          <div style={SELECTION_CARD_HEADER_STYLE}>
            {labels.selection ?? "Selection"}
          </div>
          <div
            style={selectionRow({ borderBottom: "1px solid var(--rp-border)" })}
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
            style={selectionRow({ borderBottom: "1px solid var(--rp-border)" })}
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
      <div style={FOOTER_ACTIONS_STYLE}>
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
});
  