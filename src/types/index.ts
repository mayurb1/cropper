import type { CSSProperties, ReactNode } from "react";

export type ImageEditorTheme = "light" | "dark" | "auto";

export interface ImageEditorLabels {
  title?: string;
  close?: string;
  crop?: string;
  resize?: string;
  scale?: string;
  seo?: string;
  cropMode?: string;
  cropModeFree?: string;
  cropModeFixed?: string;
  aspectRatio?: string;
  selection?: string;
  discard?: string;
  editThenSave?: string;
  /** Label for the rotate/flip dropdown trigger */
  imageRotationMenu?: string;
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
}

/** Config for the optional fourth (custom) tab. User provides label and content rendered in the sidebar. */
export interface CustomTabConfig {
  /** Label shown in the tab button */
  label: string;
  /** Component rendered in the sidebar when this tab is active */
  content: ReactNode;
}

export interface ImageEditorStyles {
  root?: CSSProperties;
  card?: CSSProperties;
  toolbar?: CSSProperties;
  /** Row containing the image rotation menu above the canvas */
  transformBar?: CSSProperties;
  canvasWrapper?: CSSProperties;
  /** Scrollable region when `canvasFrame` is set */
  canvasScrollArea?: CSSProperties;
  overlay?: CSSProperties;
  modal?: CSSProperties;
}

export interface ImageEditorProps {
  /** Initial image URL. Ignored when `file` is provided. */
  src?: string | null;
  /** File to edit (e.g. from an input). Creates and revokes object URL internally. */
  file?: File | null;
  maxViewport?: { width: number; height: number };
  /**
   * Fixed width and height of the image area. When the scaled canvas exceeds this box,
   * scrollbars appear. Omit for responsive layout (`maxWidth: 100%` on the canvas).
   */
  canvasFrame?: { width: number; height: number };
  onExport?: (blob: Blob, meta?: { width: number; height: number; mime: string }) => void;
  onClose?: () => void;
  mime?: string;
  className?: string;
  modal?: boolean;
  theme?: ImageEditorTheme;
  labels?: Partial<ImageEditorLabels>;
  classNameToolbar?: string;
  classNameTransformBar?: string;
  classNameCanvasWrapper?: string;
  /** Applied to the scroll container when `canvasFrame` is set */
  classNameCanvasScrollArea?: string;
  classNameModal?: string;
  classNameOverlay?: string;
  styles?: ImageEditorStyles;
  /** Optional fourth tab: custom label and content rendered in the sidebar */
  customTab?: CustomTabConfig;
}

export interface HistoryEntry {
  dataURL: string;
  width: number;
  height: number;
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
