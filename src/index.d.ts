import type { ComponentType, CSSProperties } from "react";

export type ImageEditorTheme = "light" | "dark" | "auto";

export interface ImageEditorLabels {
  title?: string;
  close?: string;
  crop?: string;
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
  scale?: string;
  width?: string;
  height?: string;
  aspectRatio?: string;
  selectOrUpload?: string;
  imageLoaded?: string;
  originalDimensions?: string;
  currentView?: string;
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
  /** File to edit (e.g. from an input). Creates and revokes object URL internally. Use for edit-before-upload flow. */
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

export const ImageEditor: ComponentType<ImageEditorProps>;

declare const reactPixcraft: {
  ImageEditor: ComponentType<ImageEditorProps>;
};

export default reactPixcraft;
