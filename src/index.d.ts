import type { ComponentType } from "react";

export interface ImageEditorProps {
  src?: string | null;
  maxViewport?: { width: number; height: number };
  onExport?: (blob: Blob, meta?: { width: number; height: number; mime: string }) => void;
  onClose?: () => void;
  mime?: string;
  className?: string;
  modal?: boolean;
}

export const ImageEditor: ComponentType<ImageEditorProps>;

declare const reactPixcraft: {
  ImageEditor: ComponentType<ImageEditorProps>;
};

export default reactPixcraft;
