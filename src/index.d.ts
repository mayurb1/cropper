import type { ComponentType } from "react";

export interface ImageEditorProps {
  src?: string | null;
  maxViewport?: { width: number; height: number };
  onExport?: (blob: Blob) => void;
  mime?: string;
  className?: string;
}

export const ImageEditor: ComponentType<ImageEditorProps>;

declare const reactPixcraft: {
  ImageEditor: ComponentType<ImageEditorProps>;
};

export default reactPixcraft;
