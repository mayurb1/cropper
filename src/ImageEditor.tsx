/**
 * ImageEditor – React image editor using only React + native Canvas API.
 * Features: crop (free + aspect), rotate, flip, scale, undo/redo, export as Blob.
 * Dependencies: React only (no konva, use-image, etc.)
 *
 * @example
 * ```tsx
 * <ImageEditor
 *   src={imageUrl}
 *   canvasFrame={{ width: 640, height: 480 }}
 *   onExport={(blob) => console.log(blob)}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { ImageEditorProps, CropRect, Viewport } from "./types";
import {
  DEFAULT_VIEWPORT,
  DEFAULT_LABELS,
  CROP_HANDLE_SIZE,
  CORE_TABS,
  CUSTOM_TAB_ID,
} from "./constants";
import type { TabId } from "./constants";
import { loadImage, dataUrlToBlob } from "./utils/image";
import { axisAlignedBoundsForRotatedRect } from "./utils/geometry";
import {
  getCropRectNormalized,
  clampRectToViewport,
  normalizeFromPoints,
  hitTestCropHandle,
  resizeCropRectFromHandle,
} from "./utils/crop";
import type { CropHandle } from "./utils/crop";
import { useTheme } from "./hooks/useTheme";
import { useImageLoader } from "./hooks/useImageLoader";
import { useObjectURL } from "./hooks/useObjectURL";
import { useEditorHistory } from "./hooks/useEditorHistory";
import {
  EditorToolbar,
  EditorTransformMenu,
  CropSidebar,
  ResizeSidebar,
  ScaleSidebar,
  EditorFooter,
} from "./components";
import type { EditorToolbarTab } from "./components";

export function ImageEditor({
  src,
  file,
  maxViewport = DEFAULT_VIEWPORT,
  canvasFrame,
  onExport,
  onClose,
  mime = "image/png",
  className,
  modal = true,
  theme = "light",
  labels: labelsProp,
  classNameToolbar,
  classNameTransformBar,
  classNameCanvasWrapper,
  classNameCanvasScrollArea,
  classNameModal,
  classNameOverlay,
  styles: stylesProp,
  customTab,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp } as typeof DEFAULT_LABELS),
    [labelsProp]
  );

  const [activeTab, setActiveTab] = useState<TabId>("crop");

  const editorTabs = useMemo((): EditorToolbarTab[] => {
    const core: EditorToolbarTab[] = CORE_TABS.map((id) => ({
      id,
      label: labels[id] ?? id,
    }));
    if (customTab) {
      core.push({ id: CUSTOM_TAB_ID, label: customTab.label });
    }
    return core;
  }, [labels, customTab]);

  useEffect(() => {
    if (activeTab === CUSTOM_TAB_ID && !customTab) {
      setActiveTab("crop");
    }
  }, [activeTab, customTab]);

  const { baseURL, setBaseURL } = useObjectURL(file, src, uploadedFile);
  const { resolvedTheme, themeVars } = useTheme(theme ?? "light");
  const { loadedImg, imgSize, setImgSize, isLoading } = useImageLoader(baseURL);
  const {
    history,
    redoStack,
    pushHistory,
    undo,
    redoAction,
    cancelToFirst,
    setHistory,
    setRedoStack,
  } = useEditorHistory(baseURL, imgSize, setBaseURL, setImgSize);

  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState({ x: false, y: false });
  const pendingTransformCommitRef = useRef(false);

  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [cropModeType, setCropModeType] = useState<"free" | "fixed">("free");

  const [scaleW, setScaleW] = useState("");
  const [scaleH, setScaleH] = useState("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [scaleFactorPercent, setScaleFactorPercent] = useState(100);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    rect: CropRect;
  } | null>(null);
  const resizeHandleRef = useRef<CropHandle | null>(null);

  const viewport = useMemo((): Viewport => {
    const imgW = imgSize.width || 1;
    const imgH = imgSize.height || 1;
    const maxW = maxViewport.width;
    const maxH = maxViewport.height;
    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const { width: bw, height: bh } = axisAlignedBoundsForRotatedRect(
      drawW,
      drawH,
      rotation
    );
    const w = Math.max(1, Math.ceil(bw - 1e-9));
    const h = Math.max(1, Math.ceil(bh - 1e-9));
    return { w, h, scale };
  }, [imgSize, maxViewport.width, maxViewport.height, rotation]);

  const canvasStyle = useMemo((): CSSProperties => {
    const base: CSSProperties = {
      display: "block",
      margin: "0 auto",
      backgroundImage:
        "linear-gradient(45deg, var(--rp-checker) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--rp-checker) 75%)",
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 8px 8px",
      borderRadius: 8,
    };
    if (canvasFrame) {
      base.maxWidth = "none";
    } else {
      base.maxWidth = "100%";
      base.height = "auto";
    }
    return base;
  }, [canvasFrame]);

  useEffect(() => {
    setRotation(0);
    setFlip({ x: false, y: false });
    setCropRect(null);
    setScaleW("");
    setScaleH("");
    setScaleFactorPercent(100);
  }, [baseURL]);

  useEffect(() => {
    setCropMode(activeTab === "crop");
    if (activeTab !== "crop") setCropRect(null);
  }, [activeTab, baseURL]);

  useEffect(() => {
    if (activeTab === "resize" && imgSize.width > 0 && imgSize.height > 0) {
      setScaleW(String(imgSize.width));
      setScaleH(String(imgSize.height));
    }
  }, [activeTab, imgSize.width, imgSize.height]);

  const setCropModeTypeAndAspect = useCallback((type: "free" | "fixed") => {
    setCropModeType(type);
    if (type === "free") setAspect(undefined);
    else setAspect((a) => (a === undefined ? 16 / 9 : a));
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!modal || !open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal, open, handleClose]);

  useEffect(() => {
    if (!modal || !open) return;
    const timer = requestAnimationFrame(() => {
      const el = modalContentRef.current;
      if (!el) return;
      const focusables = el.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusables[0];
      if (first && typeof (first as HTMLElement).focus === "function")
        (first as HTMLElement).focus();
    });
    return () => cancelAnimationFrame(timer);
  }, [modal, open]);

  const originalAspectRatio = useMemo(() => {
    if (imgSize.width && imgSize.height) return imgSize.width / imgSize.height;
    if (viewport.w > 0 && viewport.h > 0) return viewport.w / viewport.h;
    return null;
  }, [imgSize, viewport]);

  const commitCurrentViewToBitmap = useCallback(
    async (targetW?: number, targetH?: number) => {
      if (!loadedImg) return;

      const { w, h, scale } = viewport;
      const imgW = loadedImg.naturalWidth || loadedImg.width;
      const imgH = loadedImg.naturalHeight || loadedImg.height;
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const ox = (w - drawW) / 2;
      const oy = (h - drawH) / 2;

      const temp = document.createElement("canvas");
      temp.width = w;
      temp.height = h;
      const tctx = temp.getContext("2d")!;
      tctx.save();
      tctx.translate(w / 2, h / 2);
      tctx.rotate((rotation * Math.PI) / 180);
      tctx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
      tctx.translate(-w / 2, -h / 2);
      tctx.drawImage(loadedImg, 0, 0, imgW, imgH, ox, oy, drawW, drawH);
      tctx.restore();

      let outW = w;
      let outH = h;
      if (targetW || targetH) {
        if (targetW && targetH) {
          outW = targetW;
          outH = targetH;
        } else if (targetW) {
          outW = targetW;
          outH = Math.round(targetW / (w / h));
        } else {
          outH = targetH!;
          outW = Math.round(targetH! * (w / h));
        }
      }

      const offscreen = document.createElement("canvas");
      offscreen.width = outW;
      offscreen.height = outH;
      const octx = offscreen.getContext("2d")!;
      octx.drawImage(temp, 0, 0, w, h, 0, 0, outW, outH);

      const dataURL = offscreen.toDataURL(mime);
      const decoded = await loadImage(dataURL);
      pushHistory(baseURL || dataURL, imgSize.width, imgSize.height);
      setBaseURL(dataURL);
      setImgSize({ width: decoded.width, height: decoded.height });
      setRotation(0);
      setFlip({ x: false, y: false });
    },
    [
      loadedImg,
      viewport,
      rotation,
      flip,
      baseURL,
      imgSize,
      mime,
      pushHistory,
      setBaseURL,
      setImgSize,
    ]
  );

  useEffect(() => {
    if (!pendingTransformCommitRef.current || !loadedImg) return;
    pendingTransformCommitRef.current = false;
    commitCurrentViewToBitmap();
  }, [rotation, flip, loadedImg, commitCurrentViewToBitmap]);

  const requestTransformCommit = useCallback(() => {
    pendingTransformCommitRef.current = true;
  }, []);

  const rotateLeft = useCallback(() => {
    setRotation((d) => (d - 90 + 360) % 360);
    requestTransformCommit();
  }, [requestTransformCommit]);

  const rotateRight = useCallback(() => {
    setRotation((d) => (d + 90) % 360);
    requestTransformCommit();
  }, [requestTransformCommit]);

  const rotate180 = useCallback(() => {
    setRotation((d) => (d + 180) % 360);
    requestTransformCommit();
  }, [requestTransformCommit]);

  const flipH = useCallback(() => {
    setFlip((f) => ({ ...f, x: !f.x }));
    requestTransformCommit();
  }, [requestTransformCommit]);

  const flipV = useCallback(() => {
    setFlip((f) => ({ ...f, y: !f.y }));
    requestTransformCommit();
  }, [requestTransformCommit]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loadedImg) return;

    const ctx = canvas.getContext("2d")!;
    const { w, h, scale } = viewport;

    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.save();

    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
    ctx.translate(-w / 2, -h / 2);

    const imgW = loadedImg.naturalWidth || loadedImg.width;
    const imgH = loadedImg.naturalHeight || loadedImg.height;
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const ox = (w - drawW) / 2;
    const oy = (h - drawH) / 2;
    ctx.drawImage(loadedImg, 0, 0, imgW, imgH, ox, oy, drawW, drawH);
    ctx.restore();

    if (cropRect && (cropRect.width !== 0 || cropRect.height !== 0)) {
      const drawX = Math.min(cropRect.x, cropRect.x + cropRect.width);
      const drawY = Math.min(cropRect.y, cropRect.y + cropRect.height);
      const drawWc = Math.abs(cropRect.width);
      const drawHc = Math.abs(cropRect.height);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.rect(drawX, drawY, drawWc, drawHc);
      ctx.fill("evenodd");
      ctx.strokeStyle = resolvedTheme === "dark" ? "#58a6ff" : "#218bff";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(drawX, drawY, drawWc, drawHc);
      ctx.setLineDash([]);
      const handleColor = resolvedTheme === "dark" ? "#58a6ff" : "#218bff";
      const hs = CROP_HANDLE_SIZE / 2;
      const handles: [number, number][] = [
        [drawX, drawY],
        [drawX + drawWc, drawY],
        [drawX + drawWc, drawY + drawHc],
        [drawX, drawY + drawHc],
        [drawX + drawWc / 2, drawY],
        [drawX + drawWc, drawY + drawHc / 2],
        [drawX + drawWc / 2, drawY + drawHc],
        [drawX, drawY + drawHc / 2],
      ];
      ctx.fillStyle = handleColor;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      for (const [hx, hy] of handles) {
        ctx.fillRect(hx - hs, hy - hs, CROP_HANDLE_SIZE, CROP_HANDLE_SIZE);
        ctx.strokeRect(hx - hs, hy - hs, CROP_HANDLE_SIZE, CROP_HANDLE_SIZE);
      }
    }
  }, [loadedImg, viewport, rotation, flip, cropRect, resolvedTheme]);

  useLayoutEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const onCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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
          if (
            hit &&
            hit !== "center" &&
            ["nw", "ne", "se", "sw", "n", "e", "s", "w"].includes(hit)
          ) {
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
    [cropMode, cropRect]
  );

  const onCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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
    [cropMode, cropRect, aspect, viewport]
  );

  const clearDragState = useCallback(() => {
    isDrawingRef.current = false;
    startPointRef.current = null;
    dragStartRef.current = null;
    resizeHandleRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "";
  }, []);

  useEffect(() => {
    if (!cropMode) return;
    const onWindowMouseUp = () => clearDragState();
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
  }, [cropMode, clearDragState]);

  const applyCrop = useCallback(async () => {
    if (!loadedImg || !cropRect) return;

    const { w, h, scale } = viewport;
    const imgW = loadedImg.naturalWidth || loadedImg.width;
    const imgH = loadedImg.naturalHeight || loadedImg.height;
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const ox = (w - drawW) / 2;
    const oy = (h - drawH) / 2;

    const x = Math.min(cropRect.x, cropRect.x + cropRect.width);
    const y = Math.min(cropRect.y, cropRect.y + cropRect.height);
    const cw = Math.abs(cropRect.width);
    const ch = Math.abs(cropRect.height);

    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;
    const tctx = temp.getContext("2d")!;
    tctx.save();
    tctx.translate(w / 2, h / 2);
    tctx.rotate((rotation * Math.PI) / 180);
    tctx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
    tctx.translate(-w / 2, -h / 2);
    tctx.drawImage(loadedImg, 0, 0, imgW, imgH, ox, oy, drawW, drawH);
    tctx.restore();

    const offscreen = document.createElement("canvas");
    offscreen.width = cw;
    offscreen.height = ch;
    const octx = offscreen.getContext("2d")!;
    octx.drawImage(temp, x, y, cw, ch, 0, 0, cw, ch);

    const dataURL = offscreen.toDataURL(mime);
    const img = await loadImage(dataURL);
    pushHistory(baseURL || dataURL, imgSize.width, imgSize.height);
    setBaseURL(dataURL);
    setImgSize({ width: img.width, height: img.height });
    setCropRect(null);
  }, [
    loadedImg,
    cropRect,
    viewport,
    rotation,
    flip,
    baseURL,
    imgSize,
    mime,
    pushHistory,
    setBaseURL,
    setImgSize,
  ]);

  const applyResizeAction = useCallback(async () => {
    const w = parseInt(scaleW || "0", 10);
    const h = parseInt(scaleH || "0", 10);
    if (!w && !h) return;
    await commitCurrentViewToBitmap(w || undefined, h || undefined);
    setScaleW("");
    setScaleH("");
  }, [scaleW, scaleH, commitCurrentViewToBitmap]);

  const applyScaleAction = useCallback(async () => {
    if (!imgSize.width || !imgSize.height) return;
    const outW = Math.round((imgSize.width * scaleFactorPercent) / 100);
    const outH = Math.round((imgSize.height * scaleFactorPercent) / 100);
    if (outW < 1 || outH < 1) return;
    await commitCurrentViewToBitmap(outW, outH);
  }, [imgSize, scaleFactorPercent, commitCurrentViewToBitmap]);

  const onSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL(mime);
    const blob = dataUrlToBlob(dataURL);
    onExport?.(blob, { width: viewport.w, height: viewport.h, mime });
  }, [viewport, mime, onExport]);

  const onCancel = useCallback(() => {
    cancelToFirst();
  }, [cancelToFirst]);

  const onPickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadedFile(file);
      setHistory([]);
      setRedoStack([]);
      e.target.value = "";
    },
    [setHistory, setRedoStack]
  );

  const editorInner = (
    <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <h2
              id="react-pixcraft-title"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: "var(--rp-text)",
              }}
            >
              {labels.title}
            </h2>
            <span
              style={{
                fontSize: 12,
                color: "var(--rp-text-muted)",
                display: "block",
                marginTop: 2,
              }}
            >
              {baseURL
                ? isLoading
                  ? "Loading…"
                  : labels.imageLoaded
                : labels.selectOrUpload}
            </span>
          </div>
        </div>

        <EditorToolbar
          tabs={editorTabs}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onClose={handleClose}
          labels={labels}
          classNameToolbar={classNameToolbar}
          styles={stylesProp}
        />

        {baseURL && (
          <div
            className={classNameTransformBar}
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 12,
              ...stylesProp?.transformBar,
            }}
          >
            <EditorTransformMenu
              labels={{
                imageRotationMenu:
                  labels.imageRotationMenu ?? DEFAULT_LABELS.imageRotationMenu,
                rotateLeft: labels.rotateLeft ?? DEFAULT_LABELS.rotateLeft,
                rotateRight: labels.rotateRight ?? DEFAULT_LABELS.rotateRight,
                rotate180: labels.rotate180 ?? DEFAULT_LABELS.rotate180,
                flipVertical:
                  labels.flipVertical ?? DEFAULT_LABELS.flipVertical,
                flipHorizontal:
                  labels.flipHorizontal ?? DEFAULT_LABELS.flipHorizontal,
              }}
              onRotateLeft={rotateLeft}
              onRotateRight={rotateRight}
              onRotate180={rotate180}
              onFlipVertical={flipV}
              onFlipHorizontal={flipH}
              disabled={isLoading}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              flex:
                activeTab === "crop" ||
                activeTab === "resize" ||
                activeTab === "scale" ||
                activeTab === CUSTOM_TAB_ID
                  ? "1 1 0"
                  : "1 1 100%",
              minWidth: 280,
            }}
          >
            <div
              className={classNameCanvasWrapper}
              style={{
                border: "1px solid var(--rp-border)",
                borderRadius: 12,
                padding: 12,
                background: "var(--rp-surface)",
                minHeight: 280,
                ...stylesProp?.canvasWrapper,
              }}
            >
              {!baseURL ? (
                <div
                  style={{
                    minHeight: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--rp-text-muted)",
                    fontSize: 14,
                  }}
                >
                  {labels.selectOrUpload}
                </div>
              ) : isLoading ? (
                <div
                  style={{
                    minHeight: 320,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--rp-text-muted)",
                    fontSize: 14,
                  }}
                >
                  Loading…
                </div>
              ) : (
                <>
                  {activeTab === "crop" &&
                  cropRect &&
                  (cropRect.width !== 0 || cropRect.height !== 0) &&
                  (() => {
                    const r = getCropRectNormalized(cropRect);
                    if (!r) return null;
                    return (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--rp-text-muted)",
                          marginBottom: 6,
                        }}
                      >
                        {Math.round(r.x)}, {Math.round(r.y)} ·{" "}
                        {Math.round(r.width)} × {Math.round(r.height)} px
                      </div>
                    );
                  })()}
                  <div
                    className={
                      canvasFrame ? classNameCanvasScrollArea : undefined
                    }
                    style={
                      canvasFrame
                        ? {
                            width: canvasFrame.width,
                            height: canvasFrame.height,
                            overflow: "auto",
                            ...stylesProp?.canvasScrollArea,
                          }
                        : undefined
                    }
                  >
                    <canvas
                      ref={canvasRef}
                      width={viewport.w}
                      height={viewport.h}
                      onMouseDown={onCanvasMouseDown}
                      onMouseMove={onCanvasMouseMove}
                      onMouseUp={clearDragState}
                      onMouseLeave={clearDragState}
                      style={canvasStyle}
                    />
                  </div>
                  {baseURL && (
                    <div
                      style={{
                        textAlign: "center",
                        marginTop: 6,
                        fontSize: 12,
                        color: "var(--rp-text-muted)",
                      }}
                    >
                      {viewport.w} × {viewport.h} px
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {activeTab === "crop" && (
            <CropSidebar
              cropModeType={cropModeType}
              setCropModeType={setCropModeType}
              setCropModeTypeAndAspect={setCropModeTypeAndAspect}
              aspect={aspect}
              setAspect={setAspect}
              cropRect={cropRect}
              setCropRect={setCropRect}
              viewport={viewport}
              onApplyCrop={applyCrop}
              onClearCrop={() => setCropRect(null)}
              labels={labels}
              baseURL={baseURL}
            />
          )}

          {activeTab === "resize" && (
            <ResizeSidebar
              scaleW={scaleW}
              setScaleW={setScaleW}
              scaleH={scaleH}
              setScaleH={setScaleH}
              lockAspectRatio={lockAspectRatio}
              setLockAspectRatio={setLockAspectRatio}
              originalAspectRatio={originalAspectRatio}
              imgSize={imgSize}
              onApplyResize={applyResizeAction}
              labels={labels}
              baseURL={baseURL}
            />
          )}

          {activeTab === "scale" && (
            <ScaleSidebar
              scaleFactorPercent={scaleFactorPercent}
              setScaleFactorPercent={setScaleFactorPercent}
              imgSize={imgSize}
              onApplyScale={applyScaleAction}
              labels={labels}
              baseURL={baseURL}
            />
          )}

          {activeTab === CUSTOM_TAB_ID && customTab && (
            <div
              role="tabpanel"
              id={`react-pixcraft-panel-${CUSTOM_TAB_ID}`}
              aria-labelledby={`react-pixcraft-tab-${CUSTOM_TAB_ID}`}
              style={{ minWidth: 280 }}
            >
              {customTab.content}
            </div>
          )}
        </div>

        <EditorFooter
          historyLength={history.length}
          redoLength={redoStack.length}
          onUndo={undo}
          onRedo={redoAction}
          onCancel={onCancel}
          onPickFile={onPickFile}
          onSave={onSave}
          labels={labels}
          fileInputRef={fileInputRef}
        />
    </>
  );

  const editorContent = (
    <div
      className={`react-pixcraft-editor ${className ?? ""}`.trim()}
      style={{ ...themeVars, ...stylesProp?.root }}
      data-theme={resolvedTheme}
      ref={modal ? undefined : modalContentRef}
    >
      <div
        style={{
          border: "1px solid var(--rp-border)",
          borderRadius: 12,
          padding: 16,
          background: "var(--rp-bg)",
          ...stylesProp?.card,
        }}
      >
        {editorInner}
      </div>
    </div>
  );

  if (!open) return null;
  if (modal) {
    const modalPanelClass = [
      "react-pixcraft-editor",
      className,
      classNameModal,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const modalPanelStyle: CSSProperties = {
      maxWidth: "95vw",
      maxHeight: "95vh",
      overflow: "auto",
      position: "relative",
      boxShadow: "var(--rp-shadow)",
      border: "1px solid var(--rp-border)",
      borderRadius: 12,
      padding: 16,
      background: "var(--rp-bg)",
      ...stylesProp?.modal,
      ...stylesProp?.root,
      ...stylesProp?.card,
    };

    return (
      <div
        className={classNameOverlay}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          background: "var(--rp-overlay)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          ...themeVars,
          ...stylesProp?.overlay,
        }}
        onClick={handleClose}
      >
        <div
          className={modalPanelClass || undefined}
          data-theme={resolvedTheme}
          ref={modalContentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="react-pixcraft-title"
          style={modalPanelStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {editorInner}
        </div>
      </div>
    );
  }
  return editorContent;
}
