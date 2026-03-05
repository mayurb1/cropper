import type { CSSProperties } from "react";

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

export interface ImageEditorStyles {
  root?: CSSProperties;
  card?: CSSProperties;
  toolbar?: CSSProperties;
  canvasWrapper?: CSSProperties;
  overlay?: CSSProperties;
  modal?: CSSProperties;
}

export interface ImageEditorProps {
  /** Initial image URL. Ignored when `file` is provided. */
  src?: string | null;
  /** File to edit (e.g. from an input). Creates and revokes object URL internally. */
  file?: File | null;
  maxViewport?: { width: number; height: number };
  onExport?: (blob: Blob, meta?: { width: number; height: number; mime: string }) => void;
  onClose?: () => void;
  mime?: string;
  className?: string;
  modal?: boolean;
  theme?: ImageEditorTheme;
  labels?: Partial<ImageEditorLabels>;
  classNameToolbar?: string;
  classNameCanvasWrapper?: string;
  classNameModal?: string;
  classNameOverlay?: string;
  styles?: ImageEditorStyles;
}

export interface HistoryEntry {
  dataURL: string;
  width: number;
  height: number;
}

export interface Viewport {
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
