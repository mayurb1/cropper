/**
 * ImageEditor – React image editor using only React + native Canvas API.
 * Features: crop (free + aspect), rotate/flip in the crop sidebar, resize, scale, filters,
 * export tab (format / quality / download / clipboard), undo/redo, optional batch filmstrip,
 * keyboard shortcuts (`?`), history thumbnails, and worker-assisted resize for very large outputs.
 *
 * @param props.showFiltersTab - Show the Filters tab (default: `true`).
 * @param props.showExportTab - Show the Export tab (default: `true`).
 * @param props.batch - Optional list of images; shows a filmstrip and “Apply to all” on resize/scale.
 * @param props.shortcutsRequireFocus - When `true`, keyboard shortcuts only apply after the user has focused or clicked inside the editor. Defaults to `true` when `modal` is `false`, and `false` when `modal` is `true`.
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
import type {
  ImageEditorProps,
  CropRect,
  Viewport,
  FilterConfig,
  ExportImageFormat,
} from "./types";
import {
  DEFAULT_VIEWPORT,
  DEFAULT_LABELS,
  CROP_HANDLE_SIZE,
  CORE_TABS,
  CUSTOM_TAB_ID,
  FILTERS_TAB_ID,
  EXPORT_TAB_ID,
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
import { buildCanvasFilterString, isFilterDefault } from "./utils/filterString";
import { createImageResizeWorker } from "./utils/createImageResizeWorker";
import { validateDimension } from "./utils/validation";
import { useTheme } from "./hooks/useTheme";
import { useImageLoader } from "./hooks/useImageLoader";
import { useObjectURL } from "./hooks/useObjectURL";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { useToast } from "./hooks/useToast";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import {
  EditorToolbar,
  CropSidebar,
  ResizeSidebar,
  ScaleSidebar,
  EditorFooter,
  FiltersSidebar,
  ExportSidebar,
  HistoryPanel,
  ShortcutsModal,
} from "./components";
import type { EditorToolbarTab } from "./components";

const DEFAULT_FILTER: FilterConfig = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  grayscale: 0,
  sepia: 0,
  blurPx: 0,
};

const WORKER_PIXEL_THRESHOLD = 4_000_000;

function isExportMime(m: string): m is ExportImageFormat {
  return (
    m === "image/jpeg" ||
    m === "image/png" ||
    m === "image/webp" ||
    m === "image/avif"
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(blob);
  });
}

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
  classNameCanvasWrapper,
  classNameCanvasScrollArea,
  classNameModal,
  classNameOverlay,
  styles: stylesProp,
  customTab,
  showFiltersTab = true,
  showExportTab = true,
  batch,
  shortcutsRequireFocus: shortcutsRequireFocusProp,
}: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const editorRootRef = useRef<HTMLDivElement>(null);
  const editorHasFocusRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [open, setOpen] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [compact, setCompact] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [filter, setFilter] = useState<FilterConfig>(DEFAULT_FILTER);
  const [exportMime, setExportMime] = useState<ExportImageFormat>(() =>
    isExportMime(mime) ? mime : "image/png"
  );
  const [exportQuality, setExportQuality] = useState(92);

  const { message: toastMessage, show: showToast } = useToast();

  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...labelsProp } as typeof DEFAULT_LABELS),
    [labelsProp]
  );

  useEffect(() => {
    if (isExportMime(mime)) setExportMime(mime);
  }, [mime]);

  const batchItems = batch ?? [];
  const batchKey = useMemo(
    () =>
      batchItems
        .map((b) => `${b.file.name}-${b.file.size}-${b.file.lastModified}`)
        .join("|"),
    [batchItems]
  );

  const batchPreviewEntries = useMemo(() => {
    return batchItems.map((item, i) => ({
      i,
      url: URL.createObjectURL(item.file),
      label: item.label ?? item.file.name,
    }));
  }, [batchKey, batchItems]);

  useEffect(() => {
    return () => {
      batchPreviewEntries.forEach((e) => URL.revokeObjectURL(e.url));
    };
  }, [batchPreviewEntries]);

  const fileForUrl =
    batchItems.length > 0
      ? batchItems[batchIndex]?.file ?? null
      : file ?? null;

  useEffect(() => {
    setBatchIndex((i) =>
      batchItems.length === 0 ? 0 : Math.min(i, batchItems.length - 1)
    );
  }, [batchItems.length]);

  const [activeTab, setActiveTab] = useState<TabId>("crop");

  const editorTabs = useMemo((): EditorToolbarTab[] => {
    const core: EditorToolbarTab[] = CORE_TABS.map((id) => ({
      id,
      label: labels[id] ?? id,
    }));
    if (showFiltersTab) {
      core.push({
        id: FILTERS_TAB_ID,
        label: labels.filters ?? "Filters",
      });
    }
    if (showExportTab) {
      core.push({
        id: EXPORT_TAB_ID,
        label: labels.export ?? "Export",
      });
    }
    if (customTab) {
      core.push({ id: CUSTOM_TAB_ID, label: customTab.label });
    }
    return core;
  }, [labels, customTab, showFiltersTab, showExportTab]);

  useEffect(() => {
    if (activeTab === CUSTOM_TAB_ID && !customTab) {
      setActiveTab("crop");
    }
  }, [activeTab, customTab]);

  const { baseURL, setBaseURL } = useObjectURL(fileForUrl, src, uploadedFile);
  const { resolvedTheme, themeVars } = useTheme(theme ?? "light");
  const { loadedImg, imgSize, setImgSize, isLoading } = useImageLoader(baseURL);
  const {
    history,
    redoStack,
    pushHistory,
    undo,
    redoAction,
    cancelToFirst,
    jumpToHistory,
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

  const shortcutsOpenRef = useRef(false);
  shortcutsOpenRef.current = shortcutsOpen;

  const shortcutsRequireFocus =
    shortcutsRequireFocusProp ?? !modal;

  const handleRootFocusCapture = useCallback(() => {
    editorHasFocusRef.current = true;
  }, []);

  const handleRootPointerDownCapture = useCallback(() => {
    editorHasFocusRef.current = true;
  }, []);

  const handleRootBlurCapture = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      const related = e.relatedTarget as Node | null;
      if (!related || !e.currentTarget.contains(related)) {
        editorHasFocusRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    if (!open || !shortcutsRequireFocus) return;
    const onDocPointerDown = (e: MouseEvent) => {
      const root = editorRootRef.current;
      const t = e.target;
      if (!root || !(t instanceof Node)) return;
      if (!root.contains(t)) editorHasFocusRef.current = false;
    };
    document.addEventListener("mousedown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("mousedown", onDocPointerDown, true);
  }, [open, shortcutsRequireFocus]);

  const isDrawingRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    rect: CropRect;
  } | null>(null);
  const resizeHandleRef = useRef<CropHandle | null>(null);

  useEffect(() => {
    workerRef.current = createImageResizeWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const el = editorRootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setCompact(w > 0 && w < 768);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
    setFilter(DEFAULT_FILTER);
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
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const timer = requestAnimationFrame(() => {
      const el = modalContentRef.current;
      if (!el) return;
      const focusables = el.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const first = focusables[0];
      first?.focus();
    });
    return () => {
      cancelAnimationFrame(timer);
      previousFocusRef.current?.focus?.();
    };
  }, [modal, open]);

  useEffect(() => {
    if (!modal || !open) return;
    const root = modalContentRef.current;
    if (!root) return;

    const selector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = [
        ...root.querySelectorAll<HTMLElement>(selector),
      ].filter((el) => el.offsetParent !== null || root.contains(el));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [modal, open]);

  const originalAspectRatio = useMemo(() => {
    if (imgSize.width && imgSize.height) return imgSize.width / imgSize.height;
    if (viewport.w > 0 && viewport.h > 0) return viewport.w / viewport.h;
    return null;
  }, [imgSize, viewport]);

  const batchResizeValid = useMemo(() => {
    const w = parseInt(scaleW || "0", 10);
    const h = parseInt(scaleH || "0", 10);
    return (
      w > 0 &&
      h > 0 &&
      validateDimension(w).valid &&
      validateDimension(h).valid
    );
  }, [scaleW, scaleH]);

  const filterStr = useMemo(() => buildCanvasFilterString(filter), [filter]);

  const resizeWithWorkerIfNeeded = useCallback(
    async (
      sourceCanvas: HTMLCanvasElement,
      outW: number,
      outH: number,
      outMime: string,
      quality: number
    ): Promise<string | null> => {
      const worker = workerRef.current;
      if (!worker || outW * outH < WORKER_PIXEL_THRESHOLD) return null;

      return new Promise((resolve) => {
        let settled = false;
        const finish = (value: string | null) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          worker.removeEventListener("message", onMsg);
          resolve(value);
        };

        const timeoutId = window.setTimeout(() => finish(null), 60_000);

        const onMsg = (e: MessageEvent) => {
          if (e.data?.type === "done" && e.data.blob instanceof Blob) {
            void blobToDataUrl(e.data.blob)
              .then((url) => finish(url))
              .catch(() => finish(null));
          } else {
            finish(null);
          }
        };

        worker.addEventListener("message", onMsg);

        void createImageBitmap(sourceCanvas)
          .then((bmp) => {
            try {
              worker.postMessage(
                {
                  type: "resize",
                  bitmap: bmp,
                  outW,
                  outH,
                  mime: outMime,
                  quality:
                    outMime === "image/png" ? undefined : quality / 100,
                },
                [bmp]
              );
            } catch {
              finish(null);
            }
          })
          .catch(() => finish(null));
      });
    },
    []
  );

  const commitCurrentViewToBitmap = useCallback(
    async (targetW?: number, targetH?: number, historyLabel?: string) => {
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
      tctx.filter = filterStr;
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

      setProcessing(true);
      try {
        let dataURL: string;
        const workerUrl = await resizeWithWorkerIfNeeded(
          temp,
          outW,
          outH,
          mime,
          exportQuality
        );
        if (workerUrl) {
          dataURL = workerUrl;
        } else {
          const offscreen = document.createElement("canvas");
          offscreen.width = outW;
          offscreen.height = outH;
          const octx = offscreen.getContext("2d")!;
          octx.drawImage(temp, 0, 0, w, h, 0, 0, outW, outH);
          dataURL = offscreen.toDataURL(mime);
        }

        const decoded = await loadImage(dataURL);
        pushHistory(
          baseURL || dataURL,
          imgSize.width,
          imgSize.height,
          historyLabel
        );
        setBaseURL(dataURL);
        setImgSize({ width: decoded.width, height: decoded.height });
        setRotation(0);
        setFlip({ x: false, y: false });
        setFilter(DEFAULT_FILTER);
      } finally {
        setProcessing(false);
      }
    },
    [
      loadedImg,
      viewport,
      rotation,
      flip,
      filterStr,
      baseURL,
      imgSize,
      mime,
      exportQuality,
      pushHistory,
      setBaseURL,
      setImgSize,
      resizeWithWorkerIfNeeded,
    ]
  );

  useEffect(() => {
    if (!pendingTransformCommitRef.current || !loadedImg) return;
    pendingTransformCommitRef.current = false;
    void commitCurrentViewToBitmap(undefined, undefined, "Rotate");
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

    ctx.filter = filterStr;
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
  }, [loadedImg, viewport, rotation, flip, cropRect, resolvedTheme, filterStr]);

  useLayoutEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasPoint = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

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
    [cropMode, cropRect, getCanvasPoint]
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
    [cropMode, cropRect, aspect, viewport, getCanvasPoint]
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
    tctx.filter = filterStr;
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
    pushHistory(baseURL || dataURL, imgSize.width, imgSize.height, "Crop");
    setBaseURL(dataURL);
    setImgSize({ width: img.width, height: img.height });
    setCropRect(null);
    showToast(labels.cropApplied ?? "Crop applied");
  }, [
    loadedImg,
    cropRect,
    viewport,
    rotation,
    flip,
    filterStr,
    baseURL,
    imgSize,
    mime,
    pushHistory,
    setBaseURL,
    setImgSize,
    labels.cropApplied,
    showToast,
  ]);

  const applyResizeAction = useCallback(async () => {
    const w = parseInt(scaleW || "0", 10);
    const h = parseInt(scaleH || "0", 10);
    if (!w || !h) return;
    if (!validateDimension(w).valid || !validateDimension(h).valid) return;
    await commitCurrentViewToBitmap(w, h, "Resize");
    setScaleW("");
    setScaleH("");
    showToast(labels.resizeApplied ?? "Resize applied");
  }, [
    scaleW,
    scaleH,
    commitCurrentViewToBitmap,
    labels.resizeApplied,
    showToast,
  ]);

  const applyScaleAction = useCallback(async () => {
    if (!imgSize.width || !imgSize.height) return;
    const outW = Math.round((imgSize.width * scaleFactorPercent) / 100);
    const outH = Math.round((imgSize.height * scaleFactorPercent) / 100);
    if (outW < 1 || outH < 1) return;
    await commitCurrentViewToBitmap(outW, outH, "Scale");
    showToast(labels.scaleApplied ?? "Scale applied");
  }, [
    imgSize,
    scaleFactorPercent,
    commitCurrentViewToBitmap,
    labels.scaleApplied,
    showToast,
  ]);

  const applyFilters = useCallback(async () => {
    if (!loadedImg || isFilterDefault(filter)) return;
    const iw = loadedImg.naturalWidth || loadedImg.width;
    const ih = loadedImg.naturalHeight || loadedImg.height;
    const c = document.createElement("canvas");
    c.width = iw;
    c.height = ih;
    const cx = c.getContext("2d")!;
    cx.filter = buildCanvasFilterString(filter);
    cx.drawImage(loadedImg, 0, 0);
    const dataURL = c.toDataURL(mime);
    const img = await loadImage(dataURL);
    pushHistory(baseURL || dataURL, imgSize.width, imgSize.height, "Filters");
    setBaseURL(dataURL);
    setImgSize({ width: img.width, height: img.height });
    setFilter(DEFAULT_FILTER);
    showToast(labels.filtersApplied ?? "Filters applied");
  }, [
    loadedImg,
    filter,
    mime,
    pushHistory,
    baseURL,
    imgSize,
    setBaseURL,
    setImgSize,
    labels.filtersApplied,
    showToast,
  ]);

  const exportOptions = useMemo(
    () => ({ mime: exportMime, quality: exportQuality }),
    [exportMime, exportQuality]
  );

  const exportCanvasToBlob = useCallback((): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return Promise.resolve(null);
    const q =
      exportMime === "image/png" ? undefined : exportQuality / 100;
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        exportMime,
        q
      );
    });
  }, [exportMime, exportQuality]);

  const onSave = useCallback(() => {
    void exportCanvasToBlob().then((blob) => {
      if (!blob) return;
      onExport?.(blob, {
        width: viewport.w,
        height: viewport.h,
        mime: exportMime,
        exportOptions,
      });
    });
  }, [exportCanvasToBlob, viewport, exportMime, exportOptions, onExport]);

  const onDownload = useCallback(() => {
    void exportCanvasToBlob().then((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      const ext =
        exportMime === "image/jpeg"
          ? "jpg"
          : exportMime.replace("image/", "");
      a.download = `image.${ext}`;
      a.click();
      URL.revokeObjectURL(href);
    });
  }, [exportCanvasToBlob, exportMime]);

  const onCopyClipboard = useCallback(() => {
    if (!navigator.clipboard?.write) return;
    void exportCanvasToBlob().then((blob) => {
      if (!blob) return;
      void navigator.clipboard
        .write([new ClipboardItem({ [blob.type]: blob })])
        .then(() => showToast(labels.copiedToClipboard ?? "Copied"))
        .catch(() => {
          /* clipboard may reject (permissions, unsupported type) */
        });
    });
  }, [exportCanvasToBlob, labels.copiedToClipboard, showToast]);

  const onCancel = useCallback(() => {
    cancelToFirst();
  }, [cancelToFirst]);

  const onPickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setUploadedFile(f);
      setHistory([]);
      setRedoStack([]);
      e.target.value = "";
    },
    [setHistory, setRedoStack]
  );

  const isEditableTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT")
      return true;
    return target.isContentEditable;
  }, []);

  const applyActiveTab = useCallback(() => {
    if (!baseURL || isLoading || processing) return;
    switch (activeTab) {
      case "crop":
        void applyCrop();
        break;
      case "resize":
        void applyResizeAction();
        break;
      case "scale":
        void applyScaleAction();
        break;
      case FILTERS_TAB_ID:
        void applyFilters();
        break;
      case EXPORT_TAB_ID:
        onDownload();
        break;
      default:
        break;
    }
  }, [
    baseURL,
    isLoading,
    processing,
    activeTab,
    applyCrop,
    applyResizeAction,
    applyScaleAction,
    applyFilters,
    onDownload,
  ]);

  useKeyboardShortcuts({
    getEnabled: () =>
      open &&
      (!shortcutsRequireFocus || editorHasFocusRef.current),
    isTargetEditable: isEditableTarget,
    onUndo: () => {
      if (shortcutsOpenRef.current) return;
      undo();
    },
    onRedo: () => {
      if (shortcutsOpenRef.current) return;
      redoAction();
    },
    onEscape: () => {
      if (shortcutsOpenRef.current) {
        setShortcutsOpen(false);
        return;
      }
      if (cropRect && activeTab === "crop") {
        setCropRect(null);
        return;
      }
      if (modal) handleClose();
    },
    onEnter: () => {
      if (shortcutsOpenRef.current) return;
      applyActiveTab();
    },
    onToggleHelp: () => setShortcutsOpen((o) => !o),
  });

  const onBatchApplyAll = useCallback(async () => {
    if (batchItems.length < 2 || !loadedImg) return;
    const w = parseInt(scaleW || "0", 10);
    const h = parseInt(scaleH || "0", 10);
    const resizeOk =
      activeTab === "resize" &&
      w > 0 &&
      h > 0 &&
      validateDimension(w).valid &&
      validateDimension(h).valid;
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      const url = URL.createObjectURL(item.file);
      try {
        const img = await loadImage(url);
        const c = document.createElement("canvas");
        const tw = resizeOk
          ? w
          : Math.round(
              (img.width *
                (activeTab === "scale" ? scaleFactorPercent : 100)) /
                100
            );
        const th = resizeOk
          ? h
          : Math.round(
              (img.height *
                (activeTab === "scale" ? scaleFactorPercent : 100)) /
                100
            );
        c.width = Math.max(1, tw);
        c.height = Math.max(1, th);
        const cx = c.getContext("2d")!;
        cx.drawImage(img, 0, 0, c.width, c.height);
        const blob = await new Promise<Blob | null>((resolve) =>
          c.toBlob((b) => resolve(b), exportMime, exportMime === "image/png" ? undefined : exportQuality / 100)
        );
        if (blob)
          onExport?.(blob, {
            width: c.width,
            height: c.height,
            mime: exportMime,
            exportOptions,
          });
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    showToast(labels.batchApplyAll ?? "Batch done");
  }, [
    batchItems,
    loadedImg,
    scaleW,
    scaleH,
    activeTab,
    scaleFactorPercent,
    exportMime,
    exportQuality,
    exportOptions,
    onExport,
    labels.batchApplyAll,
    showToast,
  ]);

  const sidebarActive =
    activeTab === "crop" ||
    activeTab === "resize" ||
    activeTab === "scale" ||
    activeTab === FILTERS_TAB_ID ||
    activeTab === EXPORT_TAB_ID ||
    activeTab === CUSTOM_TAB_ID;

  const editorInner = (
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {toastMessage ?? ""}
      </div>
      {toastMessage ? (
        <div
          role="status"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10002,
            padding: "10px 16px",
            background: "var(--rp-surface)",
            border: "1px solid var(--rp-border)",
            borderRadius: 8,
            boxShadow: "var(--rp-shadow)",
            fontSize: 14,
            color: "var(--rp-text)",
          }}
        >
          {toastMessage}
        </div>
      ) : null}
      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        labels={labels}
      />

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
                ? labels.processing ?? "Loading…"
                : labels.imageLoaded
              : labels.selectOrUpload}
          </span>
        </div>
        {processing ? (
          <span style={{ fontSize: 13, color: "var(--rp-primary)" }}>
            {labels.processing ?? "Processing…"}
          </span>
        ) : null}
      </div>

      <EditorToolbar
        tabs={editorTabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onClose={handleClose}
        labels={labels}
        classNameToolbar={classNameToolbar}
        styles={stylesProp}
        compact={compact}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          gap: 16,
          alignItems: "flex-start",
          width: "100%",
          minWidth: 0,
          overflowX: "auto",
        }}
      >
        {batchPreviewEntries.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: 8,
              flex: "0 0 auto",
              flexShrink: 0,
              maxHeight: compact ? 120 : 360,
              overflowX: compact ? "auto" : "hidden",
              overflowY: compact ? "hidden" : "auto",
              flexDirection: compact ? "row" : "column",
            }}
          >
            {batchPreviewEntries.map(({ i, url, label }) => (
              <button
                key={`${url}-${i}`}
                type="button"
                onClick={() => setBatchIndex(i)}
                style={{
                  padding: 4,
                  border:
                    i === batchIndex
                      ? "2px solid var(--rp-primary)"
                      : "1px solid var(--rp-border)",
                  borderRadius: 8,
                  background: "var(--rp-input-bg)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                title={label}
              >
                <img
                  src={url}
                  alt=""
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    display: "block",
                    borderRadius: 4,
                  }}
                />
              </button>
            ))}
          </div>
        ) : null}

        <div
          style={{
            flex: sidebarActive ? "1 1 0" : "1 1 100%",
            minWidth: 0,
          }}
        >
          <div
            className={classNameCanvasWrapper}
            style={{
              border: "1px solid var(--rp-border)",
              borderRadius: 12,
              padding: 12,
              background: "var(--rp-surface)",
              minHeight: compact ? 200 : 280,
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
                {labels.processing ?? "Loading…"}
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
                {baseURL ? (
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
                ) : null}
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
            onApplyCrop={() => {
              void applyCrop();
            }}
            onClearCrop={() => setCropRect(null)}
            labels={labels}
            baseURL={baseURL}
            rotationDeg={rotation}
            onRotateLeft={rotateLeft}
            onRotateRight={rotateRight}
            onRotate180={rotate180}
            onFlipHorizontal={flipH}
            onFlipVertical={flipV}
            transformDisabled={isLoading || processing}
            compact={compact}
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
            onApplyResize={() => {
              void applyResizeAction();
            }}
            labels={labels}
            baseURL={baseURL}
            compact={compact}
          />
        )}

        {activeTab === "scale" && (
          <ScaleSidebar
            scaleFactorPercent={scaleFactorPercent}
            setScaleFactorPercent={setScaleFactorPercent}
            imgSize={imgSize}
            onApplyScale={() => {
              void applyScaleAction();
            }}
            labels={labels}
            baseURL={baseURL}
            compact={compact}
          />
        )}

        {activeTab === FILTERS_TAB_ID && showFiltersTab && (
          <FiltersSidebar
            filter={filter}
            setFilter={setFilter}
            onApplyFilters={() => {
              void applyFilters();
            }}
            onResetFilters={() => setFilter(DEFAULT_FILTER)}
            labels={labels}
            baseURL={baseURL}
            compact={compact}
          />
        )}

        {activeTab === EXPORT_TAB_ID && showExportTab && (
          <ExportSidebar
            exportMime={exportMime}
            setExportMime={setExportMime}
            exportQuality={exportQuality}
            setExportQuality={setExportQuality}
            imgSize={imgSize}
            onDownload={onDownload}
            onCopyClipboard={onCopyClipboard}
            labels={labels}
            baseURL={baseURL}
            compact={compact}
          />
        )}

        {activeTab === CUSTOM_TAB_ID && customTab && (
          <div
            role="tabpanel"
            id={`react-pixcraft-panel-${CUSTOM_TAB_ID}`}
            aria-labelledby={`react-pixcraft-tab-${CUSTOM_TAB_ID}`}
            style={{
              flex: "0 0 320px",
              flexShrink: 0,
              minWidth: 280,
              maxWidth: "100%",
            }}
          >
            {customTab.content}
          </div>
        )}
      </div>

      <HistoryPanel
        history={history}
        onJumpTo={jumpToHistory}
        labels={labels}
        expanded={historyPanelOpen}
        onToggle={() => setHistoryPanelOpen((v) => !v)}
      />

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
        onToggleHistory={() => setHistoryPanelOpen((v) => !v)}
        historyPanelOpen={historyPanelOpen}
        showBatchApply={batchItems.length > 1}
        onBatchApplyAll={() => {
          void onBatchApplyAll();
        }}
        batchApplyDisabled={
          processing ||
          isLoading ||
          (activeTab !== "resize" && activeTab !== "scale") ||
          (activeTab === "resize" && !batchResizeValid)
        }
        compact={compact}
      />
    </>
  );

  const editorContent = (
    <div
      ref={editorRootRef}
      className={`react-pixcraft-editor ${className ?? ""}`.trim()}
      style={{ ...themeVars, ...stylesProp?.root, position: "relative" }}
      data-theme={resolvedTheme}
      onFocusCapture={handleRootFocusCapture}
      onBlurCapture={handleRootBlurCapture}
      onPointerDownCapture={handleRootPointerDownCapture}
    >
      <div
        ref={modal ? undefined : modalContentRef}
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
      <>
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
            ref={editorRootRef}
            className={modalPanelClass || undefined}
            data-theme={resolvedTheme}
            style={{ position: "relative", ...themeVars }}
            onFocusCapture={handleRootFocusCapture}
            onBlurCapture={handleRootBlurCapture}
            onPointerDownCapture={handleRootPointerDownCapture}
          >
            <div
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
        </div>
      </>
    );
  }
  return editorContent;
}
