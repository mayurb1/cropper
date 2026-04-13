import React, { useMemo } from "react";
import type { ExportImageFormat, ImageEditorLabels } from "../types";
import { primaryBtn, rpBtnPrimary, rpBtnOutline, outlineBtn } from "../styles";
import { estimateRgbSizeKb } from "../utils/validation";
import {
  sidebarShellStyle,
  sidebarSectionLabelStyle,
  sidebarCardStyle,
} from "../ImageEditor.styles";

export interface ExportSidebarProps {
  exportMime: ExportImageFormat;
  setExportMime: (m: ExportImageFormat) => void;
  exportQuality: number;
  setExportQuality: (q: number) => void;
  imgSize: { width: number; height: number };
  onDownload: () => void;
  onCopyClipboard: () => void;
  labels: ImageEditorLabels;
  baseURL: string | null;
  compact?: boolean;
}

const FORMATS: { mime: ExportImageFormat; labelKey: keyof ImageEditorLabels }[] =
  [
    { mime: "image/jpeg", labelKey: "formatJpeg" },
    { mime: "image/png", labelKey: "formatPng" },
    { mime: "image/webp", labelKey: "formatWebp" },
    { mime: "image/avif", labelKey: "formatAvif" },
  ];

/**
 * Export format, quality, download and copy-to-clipboard actions.
 * @example
 * ```tsx
 * <ExportSidebar exportMime={m} setExportMime={setM} exportQuality={q} setExportQuality={setQ} imgSize={sz} onDownload={dl} onCopyClipboard={cp} labels={l} baseURL={url} />
 * ```
 */
export function ExportSidebar({
  exportMime,
  setExportMime,
  exportQuality,
  setExportQuality,
  imgSize,
  onDownload,
  onCopyClipboard,
  labels,
  baseURL,
  compact = false,
}: ExportSidebarProps) {
  const disabled = !baseURL;
  const showQuality = exportMime !== "image/png";

  const estKb = useMemo(
    () => estimateRgbSizeKb(imgSize.width, imgSize.height),
    [imgSize.width, imgSize.height]
  );

  return (
    <div
      id="react-pixcraft-panel-export"
      role="tabpanel"
      aria-labelledby="react-pixcraft-tab-export"
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
          {labels.exportFormat}
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: "var(--rp-space-2)" }}
          role="radiogroup"
          aria-label={labels.exportFormat}
        >
          {FORMATS.map(({ mime, labelKey }) => {
            const id = `rp-export-${mime}`;
            const selected = exportMime === mime;
            return (
              <label
                key={mime}
                htmlFor={id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--rp-space-3)",
                  fontSize: "var(--rp-font-size-md)",
                  color: "var(--rp-text)",
                  cursor: disabled ? "not-allowed" : "pointer",
                  minHeight: compact ? 44 : 40,
                  fontFamily: "var(--rp-font-family)",
                  padding: "var(--rp-space-2) var(--rp-space-3)",
                  borderRadius: "var(--rp-radius-sm)",
                  border: `1px solid ${selected ? "var(--rp-primary)" : "var(--rp-border)"}`,
                  background: selected
                    ? "color-mix(in srgb, var(--rp-primary) 10%, var(--rp-surface))"
                    : "var(--rp-surface-muted)",
                }}
              >
                <input
                  id={id}
                  type="radio"
                  name="rp-export-format"
                  checked={selected}
                  onChange={() => setExportMime(mime)}
                  disabled={disabled}
                  style={{ accentColor: "var(--rp-primary)", width: 18, height: 18 }}
                />
                <span style={{ fontWeight: selected ? 600 : 500 }}>
                  {labels[labelKey] ?? mime}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {showQuality ? (
        <div
          style={{
            ...sidebarCardStyle,
            padding: "var(--rp-space-3)",
            flexShrink: 0,
          }}
        >
          <div style={{ ...sidebarSectionLabelStyle, marginTop: 0 }}>
            {labels.exportQuality}
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={exportQuality}
            onChange={(e) => setExportQuality(Number(e.target.value))}
            disabled={disabled}
            style={{
              width: "100%",
              accentColor: "var(--rp-primary)",
            }}
          />
          <div
            style={{
              fontSize: "var(--rp-font-size-sm)",
              color: "var(--rp-text-muted)",
              fontFamily: "var(--rp-font-family)",
              marginTop: "var(--rp-space-1)",
            }}
          >
            {exportQuality}%
          </div>
        </div>
      ) : null}

      <div
        style={{
          fontSize: "var(--rp-font-size-sm)",
          color: "var(--rp-text-muted)",
          fontFamily: "var(--rp-font-family)",
          flexShrink: 0,
        }}
      >
        {labels.estimatedSize}: ~{estKb} KB (uncompressed RGB estimate)
      </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          paddingTop: "var(--rp-space-3)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--rp-space-2)",
        }}
      >
        <button
          type="button"
          className={rpBtnPrimary}
          style={{ ...primaryBtn, width: "100%" }}
          disabled={disabled}
          onClick={onDownload}
        >
          {labels.download}
        </button>
        <button
          type="button"
          className={rpBtnOutline}
          style={{
            ...outlineBtn,
            width: "100%",
            minHeight: compact ? 44 : undefined,
          }}
          disabled={disabled}
          onClick={onCopyClipboard}
        >
          {labels.copyClipboard}
        </button>
      </div>
    </div>
  );
}
