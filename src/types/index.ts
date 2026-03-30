import type { CSSProperties, ReactNode } from "react";

export type ImageEditorTheme = "light" | "dark" | "auto";

export interface ImageEditorLabels {
  title?: string;
  close?: string;
  crop?: string;
  resize?: string;
  scale?: string;
  filters?: string;
  export?: string;
  seo?: string;
  cropMode?: string;
  cropModeFree?: string;
  cropModeFixed?: string;
  aspectRatio?: string;
  selection?: string;
  discard?: string;
  editThenSave?: string;
  /** Section label for rotate / flip controls in the crop sidebar */
  rotation?: string;
  currentAngle?: string;
  rotateLeft?: string;
  rotateRight?: string;
  rotate180?: string;
  flipVertical?: string;
  flipHorizontal?: string;
  undo?: string;
  redo?: string;
  cancelEditing?: string;
  applyCrop?: string;
  clearCrop?: string;
  upload?: string;
  save?: string;
  width?: string;
  height?: string;
  aspectRatioHint?: string;
  selectOrUpload?: string;
  /** Shown under the empty-state prompt when drag-and-drop is available */
  dropImageHint?: string;
  imageLoaded?: string;
  originalDimensions?: string;
  currentView?: string;
  outputDimensions?: string;
  widthPx?: string;
  heightPx?: string;
  lockAspectRatio?: string;
  applyResize?: string;
  scaleFactor?: string;
  applyScale?: string;
  /** Preset output sizes (resize tab) */
  sizePresets?: string;
  /** Estimated file size label */
  estimatedSize?: string;
  /** Keyboard shortcuts modal */
  keyboardShortcuts?: string;
  shortcutsClose?: string;
  shortcutUndo?: string;
  shortcutRedo?: string;
  shortcutEscape?: string;
  shortcutEnter?: string;
  shortcutHelp?: string;
  /** Toast / live region */
  cropApplied?: string;
  resizeApplied?: string;
  scaleApplied?: string;
  rotateApplied?: string;
  filtersApplied?: string;
  copiedToClipboard?: string;
  /** History panel */
  history?: string;
  historyToggle?: string;
  /** Export tab */
  exportFormat?: string;
  exportQuality?: string;
  download?: string;
  copyClipboard?: string;
  formatJpeg?: string;
  formatPng?: string;
  formatWebp?: string;
  formatAvif?: string;
  /** Batch mode */
  batchApplyAll?: string;
  /** Filters tab */
  brightness?: string;
  contrast?: string;
  saturation?: string;
  presetGrayscale?: string;
  presetSepia?: string;
  presetBlur?: string;
  applyFilters?: string;
  resetFilters?: string;
  /** Processing state */
  processing?: string;
}

/** Config for the optional fourth tab. User provides label and content rendered in the sidebar. */
export interface CustomTabConfig {
  /** Label shown in the tab button */
  label: string;
  /** Component rendered in the sidebar when this tab is active */
  content: ReactNode;
}

/** Canvas CSS filter values for preview and commit (brightness/contrast as multipliers, 1 = default). */
export interface FilterConfig {
  brightness: number;
  contrast: number;
  saturation: number;
  grayscale: number;
  sepia: number;
  blurPx: number;
}

export type ExportImageFormat = "image/jpeg" | "image/png" | "image/webp" | "image/avif";

export interface ExportOptions {
  mime: ExportImageFormat;
  quality: number;
}

/** One image in batch editing mode. */
export interface ImageEditorBatchItem {
  file: File;
  label?: string;
}

/** How the preview canvas scales relative to the source image. */
export type ImageEditorPreviewFit = "contain" | "natural";

export interface ImageEditorStyles {
  root?: CSSProperties;
  card?: CSSProperties;
  toolbar?: CSSProperties;
  canvasWrapper?: CSSProperties;
  /** Scrollable region when `canvasFrame` is set or `previewFit` is `"natural"` */
  canvasScrollArea?: CSSProperties;
  overlay?: CSSProperties;
  modal?: CSSProperties;
}

export interface ImageEditorProps {
  /** Initial image URL. Ignored when `file` is provided. */
  src?: string | null;
  /** File to edit (e.g. from an input). Creates and revokes object URL internally. */
  file?: File | null;
  /**
   * When `previewFit` is `"contain"`, caps preview scale so the image fits inside this box.
   * When `previewFit` is `"natural"`, sizes the scroll viewport if `canvasFrame` is omitted.
   */
  maxViewport?: { width: number; height: number };
  /**
   * Fixed width and height of the scrollable image area. When the canvas exceeds this box,
   * scrollbars appear. If omitted with `previewFit: "natural"`, `maxViewport` is used as the scroll port.
   * With `previewFit: "contain"` (default), omit for responsive layout (`maxWidth: 100%` on the canvas).
   */
  canvasFrame?: { width: number; height: number };
  /**
   * `"contain"` (default): scale preview to fit `maxViewport`. `"natural"`: 1:1 image pixels on the
   * canvas; use `canvasFrame` or `maxViewport` as the fixed scroll area when the image is larger.
   */
  previewFit?: ImageEditorPreviewFit;
  onExport?: (
    blob: Blob,
    meta?: { width: number; height: number; mime: string; exportOptions?: ExportOptions }
  ) => void;
  onClose?: () => void;
  mime?: string;
  className?: string;
  modal?: boolean;
  theme?: ImageEditorTheme;
  labels?: Partial<ImageEditorLabels>;
  classNameToolbar?: string;
  classNameCanvasWrapper?: string;
  /** Applied to the scroll container when `canvasFrame` is set */
  classNameCanvasScrollArea?: string;
  classNameModal?: string;
  classNameOverlay?: string;
  styles?: ImageEditorStyles;
  /** Optional tab: custom label and content rendered in the sidebar */
  customTab?: CustomTabConfig;
  /** Show the built-in Filters tab (default: true) */
  showFiltersTab?: boolean;
  /** Show the built-in Export tab (default: true) */
  showExportTab?: boolean;
  /** Optional batch queue; when set, shows a filmstrip and apply-to-all */
  batch?: ImageEditorBatchItem[];
  /**
   * When true, Ctrl+Z / Enter / etc. only apply if focus is inside the editor root.
   * Defaults to `true` when `modal` is false (avoids hijacking page shortcuts), and `false` when `modal` is true.
   */
  shortcutsRequireFocus?: boolean;
}

export interface HistoryEntry {
  dataURL: string;
  width: number;
  height: number;
  /** Optional label for history UI (e.g. "Crop", "Resize") */
  label?: string;
}

export interface Viewport {
  /** Canvas width/height (fits the rotated preview; larger than the image rect when rotation is not 0° mod 180°). */
  w: number;
  h: number;
  scale: number;
}

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}
