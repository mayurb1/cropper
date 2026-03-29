import React, { useMemo } from "react";
import type { ExportImageFormat, ImageEditorLabels } from "../types";
import { primaryBtn, baseBtn } from "../styles";
import { estimateRgbSizeKb } from "../utils/validation";

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
  gap: 12,
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--rp-text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 8,
};

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
      style={SIDEBAR_STYLE}
    >
      <div>
        <div style={LABEL}>{labels.exportFormat}</div>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 8 }}
          role="radiogroup"
          aria-label={labels.exportFormat}
        >
          {FORMATS.map(({ mime, labelKey }) => {
            const id = `rp-export-${mime}`;
            return (
              <label
                key={mime}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "var(--rp-text)",
                  cursor: disabled ? "not-allowed" : "pointer",
                  minHeight: compact ? 44 : undefined,
                }}
              >
                <input
                  id={id}
                  type="radio"
                  name="rp-export-format"
                  checked={exportMime === mime}
                  onChange={() => setExportMime(mime)}
                  disabled={disabled}
                />
                <span>{labels[labelKey] ?? mime}</span>
              </label>
            );
          })}
        </div>
      </div>
      {showQuality ? (
        <div>
          <div style={LABEL}>{labels.exportQuality}</div>
          <input
            type="range"
            min={1}
            max={100}
            value={exportQuality}
            onChange={(e) => setExportQuality(Number(e.target.value))}
            disabled={disabled}
            style={{ width: "100%", accentColor: "var(--rp-primary)" }}
          />
          <div style={{ fontSize: 12, color: "var(--rp-text-muted)" }}>
            {exportQuality}%
          </div>
        </div>
      ) : null}
      <div
        style={{
          fontSize: 12,
          color: "var(--rp-text-muted)",
        }}
      >
        {labels.estimatedSize}: ~{estKb} KB (uncompressed RGB estimate)
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          style={primaryBtn}
          disabled={disabled}
          onClick={onDownload}
        >
          {labels.download}
        </button>
        <button
          type="button"
          style={baseBtn}
          disabled={disabled}
          onClick={onCopyClipboard}
        >
          {labels.copyClipboard}
        </button>
      </div>
    </div>
  );
}
