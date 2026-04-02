import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
  type MouseEvent,
} from "react";
import type { CropRect } from "../types";
import type { Viewport } from "../types";
import { CROP_HANDLE_SIZE } from "../constants";
import {
  clampRectToViewport,
  normalizeFromPoints,
  getCropRectNormalized,
  hitTestCropHandle,
  resizeCropRectFromHandle,
} from "../utils/crop";
import type { CropHandle } from "../utils/crop";

export interface UseCropInteractionParams {
  cropMode: boolean;
  cropRect: CropRect | null;
  setCropRect: React.Dispatch<React.SetStateAction<CropRect | null>>;
  aspect: number | undefined;
  viewport: Viewport;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

const RESIZE_HANDLES = new Set<CropHandle>([
  "nw",
  "ne",
  "se",
  "sw",
  "n",
  "e",
  "s",
  "w",
]);

/**
 * Pointer-driven crop rectangle: draw, resize handles, drag center, cursor.
 */
export function useCropInteraction({
  cropMode,
  cropRect,
  setCropRect,
  aspect,
  viewport,
  canvasRef,
}: UseCropInteractionParams) {
  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    rect: CropRect;
  } | null>(null);
  const resizeHandleRef = useRef<CropHandle | null>(null);

  const getCanvasPoint = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [canvasRef]);

  const onCanvasMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPoint(e);
      if (!pos) return;

      if (cropMode) {
        if (cropRect && (cropRect.width !== 0 || cropRect.height !== 0)) {
          const hit = hitTestCropHandle(
            pos.x,
            pos.y,
            cropRect,
            CROP_HANDLE_SIZE
          );
          if (hit && hit !== "center" && RESIZE_HANDLES.has(hit)) {
            resizeHandleRef.current = hit;
            return;
          }
          if (hit === "center") {
            const r = getCropRectNormalized(cropRect);
            if (r)
              dragStartRef.current = {
                x: pos.x - r.x,
                y: pos.y - r.y,
                rect: { ...r },
              };
            return;
          }
        }
        isDrawingRef.current = true;
        startPointRef.current = pos;
        setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
      }
    },
    [cropMode, cropRect, getCanvasPoint, setCropRect]
  );

  const onCanvasMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPoint(e);
      if (!pos) return;

      if (!cropMode && canvasRef.current) {
        canvasRef.current.style.cursor = "";
      }
      if (cropMode && resizeHandleRef.current) {
        const r = getCropRectNormalized(cropRect);
        if (r) {
          const next = resizeCropRectFromHandle(
            resizeHandleRef.current,
            r.x,
            r.y,
            r.width,
            r.height,
            pos.x,
            pos.y,
            aspect,
            viewport
          );
          if (next) setCropRect(next);
        }
      } else if (cropMode && isDrawingRef.current && startPointRef.current) {
        const { x: sx, y: sy } = startPointRef.current;
        const next = normalizeFromPoints(sx, sy, pos.x, pos.y, aspect);
        setCropRect(clampRectToViewport(next, viewport));
      } else if (cropMode && dragStartRef.current) {
        const { rect, x: dx, y: dy } = dragStartRef.current;
        const clamped = clampRectToViewport(
          { ...rect, x: pos.x - dx, y: pos.y - dy },
          viewport
        );
        setCropRect(clamped);
      } else if (
        cropMode &&
        canvasRef.current &&
        cropRect &&
        (cropRect.width !== 0 || cropRect.height !== 0)
      ) {
        const hit = hitTestCropHandle(
          pos.x,
          pos.y,
          cropRect,
          CROP_HANDLE_SIZE
        );
        const cursor =
          hit === "nw" || hit === "se"
            ? "nwse-resize"
            : hit === "ne" || hit === "sw"
              ? "nesw-resize"
              : hit === "n" || hit === "s"
                ? "ns-resize"
                : hit === "e" || hit === "w"
                  ? "ew-resize"
                  : hit === "center"
                    ? "move"
                    : "crosshair";
        canvasRef.current.style.cursor = cursor;
      }
    },
    [cropMode, cropRect, aspect, viewport, getCanvasPoint, setCropRect, canvasRef]
  );

  const clearDragState = useCallback(() => {
    isDrawingRef.current = false;
    startPointRef.current = null;
    dragStartRef.current = null;
    resizeHandleRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "";
  }, [canvasRef]);

  useEffect(() => {
    if (!cropMode) return;
    const onWindowMouseUp = () => clearDragState();
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
  }, [cropMode, clearDragState]);

  return {
    getCanvasPoint,
    onCanvasMouseDown,
    onCanvasMouseMove,
    clearDragState,
  };
}
