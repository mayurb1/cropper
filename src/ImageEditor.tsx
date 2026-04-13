/**
 * ImageEditor – React image editor using only React + native Canvas API.
 * Features: crop (free + aspect), rotate/flip in the crop sidebar, resize, scale, filters,
 * export tab (format / quality / download / clipboard), undo/redo, optional batch filmstrip,
 * keyboard shortcuts (`?`), history thumbnails, and worker-assisted resize for very large outputs.
 *
 * @param props.showFiltersTab - Show the Filters tab (default: `true`).
 * @param props.showExportTab - Show the Export tab (default: `true`).
 * @param props.batch - Optional list of images; shows a filmstrip and “Apply to all” on resize/scale.
 * @param props.previewFit - `"contain"` scales the preview to fit `maxViewport`; `"natural"` draws at 1:1 image pixels with a fixed scroll port (`canvasFrame` or `maxViewport`).
 * @param props.shortcutsRequireFocus - When `true`, keyboard shortcuts only apply after the user has focused or clicked inside the editor. Defaults to `true` when `modal` is `false`, and `false` when `modal` is `true`.
 *
 * @example
 * ```tsx
 * <ImageEditor
 *   src={imageUrl}
 *   canvasFrame={{ width: 640, height: 480 }}
 *   onExport={(blob) => { void blob; }}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */

import React, {
  useCallback,
  useEffect,
  useId,
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
  CORE_TABS,
  CUSTOM_TAB_ID,
  FILTERS_TAB_ID,
  EXPORT_TAB_ID,
  DEFAULT_FILTER,
} from "./constants";
import type { TabId } from "./constants";
import { loadImage, isExportMime } from "./utils/image";
import { axisAlignedBoundsForRotatedRect } from "./utils/geometry";
import { getCropRectNormalized } from "./utils/crop";
import { drawImageTransformed } from "./utils/canvas";
import { buildCanvasFilterString, isFilterDefault } from "./utils/filterString";
import { validateDimension } from "./utils/validation";
import { mergeImageEditorLabels } from "./utils/mergeLabels";
import { useTheme } from "./hooks/useTheme";
import { useImageLoader } from "./hooks/useImageLoader";
import { useObjectURL } from "./hooks/useObjectURL";
import { useEditorHistory } from "./hooks/useEditorHistory";
import { useToast } from "./hooks/useToast";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useCanvasRenderer } from "./hooks/useCanvasRenderer";
import { useCropInteraction } from "./hooks/useCropInteraction";
import { useTransformActions } from "./hooks/useTransformActions";
import { useExportActions } from "./hooks/useExportActions";
import { useImageEditorBatch } from "./hooks/useImageEditorModel";
import {
  FOCUSABLE_SELECTOR,
  liveRegionStyle,
  toastFixedStyle,
  headerRowStyle,
  titleStyle,
  subtitleStyle,
  processingHeaderStyle,
  mainRowStyle,
  batchStripStyle,
  canvasColumnStyle,
  customTabPanelStyle,
  cropOverlayHintStyle,
  viewportHintStyle,
  loadingCanvasPlaceholderStyle,
  inlineCardStyle,
  canvasWrapperOuterStyle,
} from "./ImageEditor.styles";
import { sidebarShellStyle } from "./editorShell.styles";
import { ensureEditorChromeStyles } from "./editorChrome";
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
import { outlineBtn, rpBtnOutline, rpBtnSurface } from "./styles";

export function ImageEditor({
  src,
  file,
  maxViewport = DEFAULT_VIEWPORT,
  canvasFrame,
  previewFit = "contain",
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
  const modalContentRef = useRef<HTMLDivElement>(null);
  const editorRootRef = useRef<HTMLDivElement>(null);
  const editorHasFocusRef = useRef(false);
  const emptyUploadInputRef = useRef<HTMLInputElement>(null);
  const emptyDropDepthRef = useRef(0);
  const emptyUploadInputId = useId();
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const [open, setOpen] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [compact, setCompact] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);
  const [emptyStateDragActive, setEmptyStateDragActive] = useState(false);
  const [filter, setFilter] = useState<FilterConfig>(DEFAULT_FILTER);
  const [exportMime, setExportMime] = useState<ExportImageFormat>(() =>
    isExportMime(mime) ? mime : "image/png"
  );
  const [exportQuality, setExportQuality] = useState(92);

  const { message: toastMessage, show: showToast } = useToast();

  const labels = useMemo(
    () => mergeImageEditorLabels(labelsProp),
    [labelsProp]
  );

  useEffect(() => {
    if (isExportMime(mime)) setExportMime(mime);
  }, [mime]);

  const {
    batchItems,
    batchPreviewEntries,
    fileForUrl,
    batchIndex,
    setBatchIndex,
  } = useImageEditorBatch(batch, file);

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

  useEffect(() => {
    ensureEditorChromeStyles();
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
    const scale =
      previewFit === "natural"
        ? 1
        : Math.min(maxW / imgW, maxH / imgH, 1);
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
  }, [
    imgSize,
    maxViewport.width,
    maxViewport.height,
    rotation,
    previewFit,
  ]);

  const canvasScrollPort =
    previewFit === "natural"
      ? (canvasFrame ?? maxViewport)
      : canvasFrame ?? null;

  const canvasStyle = useMemo((): CSSProperties => {
    const base: CSSProperties = {
      display: "block",
      margin: "0 auto",
      backgroundImage:
        "linear-gradient(45deg, var(--rp-checker) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--rp-checker) 75%)",
      backgroundSize: "16px 16px",
      backgroundPosition: "0 0, 8px 8px",
      borderRadius: "var(--rp-radius-sm)",
      border: "1px solid color-mix(in srgb, var(--rp-border) 85%, transparent)",
      boxShadow: "0 8px 24px -12px color-mix(in srgb, var(--rp-text) 18%, transparent)",
    };
    if (canvasScrollPort) {
      base.maxWidth = "none";
    } else {
      base.maxWidth = "100%";
      base.height = "auto";
    }
    return base;
  }, [canvasScrollPort]);

  useEffect(() => {
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
      const focusables = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
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

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = [
        ...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
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

  const {
    commitCurrentViewToBitmap,
    rotateLeft,
    rotateRight,
    rotate180,
    flipH,
    flipV,
  } = useTransformActions({
    loadedImg,
    viewport,
    filterStr,
    baseURL,
    imgSize,
    mime,
    exportQuality,
    rotation,
    flip,
    setRotation,
    setFlip,
    pushHistory,
    setBaseURL,
    setImgSize,
    setFilter,
    setProcessing,
  });

  const { canvasRef } = useCanvasRenderer({
    loadedImg,
    viewport,
    rotation,
    flip,
    cropRect,
    resolvedTheme,
    filterStr,
    cornersOnlyCropHandles: cropModeType === "fixed",
  });

  const { onCanvasMouseDown, onCanvasMouseMove, clearDragState } =
    useCropInteraction({
      cropMode,
      cropRect,
      setCropRect,
      aspect,
      viewport,
      canvasRef,
      cornersOnlyCropHandles: cropModeType === "fixed",
    });

  const { exportOptions, onSave, onDownload, onCopyClipboard } =
    useExportActions({
      canvasRef,
      exportMime,
      exportQuality,
      viewport,
      onExport,
      showToast,
      labels,
    });

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
    const tctx = temp.getContext("2d");
    if (!tctx) return;
    drawImageTransformed(
      tctx,
      loadedImg,
      w,
      h,
      ox,
      oy,
      drawW,
      drawH,
      rotation,
      flip.x,
      flip.y,
      filterStr
    );

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

  const onCancel = useCallback(() => {
    cancelToFirst();
  }, [cancelToFirst]);

  const applyPickedFile = useCallback(
    (f: File) => {
      if (!f.type.startsWith("image/")) return;
      setUploadedFile(f);
      setHistory([]);
      setRedoStack([]);
    },
    [setHistory, setRedoStack]
  );

  const onPickFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) applyPickedFile(f);
      e.target.value = "";
    },
    [applyPickedFile]
  );

  const onEmptyStateDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emptyDropDepthRef.current += 1;
    if (emptyDropDepthRef.current === 1) setEmptyStateDragActive(true);
  }, []);

  const onEmptyStateDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emptyDropDepthRef.current -= 1;
    if (emptyDropDepthRef.current <= 0) {
      emptyDropDepthRef.current = 0;
      setEmptyStateDragActive(false);
    }
  }, []);

  const onEmptyStateDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onEmptyStateDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      emptyDropDepthRef.current = 0;
      setEmptyStateDragActive(false);
      const image = Array.from(e.dataTransfer.files).find((f) =>
        f.type.startsWith("image/")
      );
      if (image) applyPickedFile(image);
    },
    [applyPickedFile]
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

  const onApplyCrop = useCallback(() => {
    void applyCrop();
  }, [applyCrop]);

  const onClearCrop = useCallback(() => {
    setCropRect(null);
  }, []);

  const onApplyResize = useCallback(() => {
    void applyResizeAction();
  }, [applyResizeAction]);

  const onApplyScale = useCallback(() => {
    void applyScaleAction();
  }, [applyScaleAction]);

  const onApplyFiltersAction = useCallback(() => {
    void applyFilters();
  }, [applyFilters]);

  const onResetFiltersToDefault = useCallback(() => {
    setFilter(DEFAULT_FILTER);
  }, []);

  const onTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const onShortcutsModalClose = useCallback(() => {
    setShortcutsOpen(false);
  }, []);

  const onBatchApplyAllClick = useCallback(() => {
    void onBatchApplyAll();
  }, [onBatchApplyAll]);

  const cropMetricsHint = useMemo(() => {
    if (
      activeTab !== "crop" ||
      !cropRect ||
      (cropRect.width === 0 && cropRect.height === 0)
    ) {
      return null;
    }
    const r = getCropRectNormalized(cropRect);
    if (!r) return null;
    return (
      <div style={cropOverlayHintStyle}>
        {Math.round(r.x)}, {Math.round(r.y)} · {Math.round(r.width)} ×{" "}
        {Math.round(r.height)} px
      </div>
    );
  }, [activeTab, cropRect]);

  const sidebarActive =
    activeTab === "crop" ||
    activeTab === "resize" ||
    activeTab === "scale" ||
    activeTab === FILTERS_TAB_ID ||
    activeTab === EXPORT_TAB_ID ||
    activeTab === CUSTOM_TAB_ID;

  const editorInner = (
    <>
      <div aria-live="polite" aria-atomic="true" style={liveRegionStyle}>
        {toastMessage ?? ""}
      </div>
      {toastMessage ? (
        <div role="status" style={toastFixedStyle}>
          {toastMessage}
        </div>
      ) : null}
      <ShortcutsModal
        open={shortcutsOpen}
        onClose={onShortcutsModalClose}
        labels={labels}
      />

      <div
        style={
          modal
            ? {
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }
            : { display: "contents" }
        }
      >
      <div
        style={{
          ...headerRowStyle,
          ...(modal ? { flexShrink: 0 } : {}),
        }}
      >
        <div>
          <h2 id="react-pixcraft-title" style={titleStyle}>
            {labels.title}
          </h2>
          <span style={subtitleStyle}>
            {baseURL
              ? isLoading
                ? labels.processing ?? "Loading…"
                : labels.imageLoaded
              : labels.selectOrUpload}
          </span>
        </div>
        {processing ? (
          <span style={processingHeaderStyle}>
            {labels.processing ?? "Processing…"}
          </span>
        ) : null}
      </div>

      <div
        style={modal ? { flexShrink: 0 } : { display: "contents" }}
      >
        <EditorToolbar
          tabs={editorTabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onClose={handleClose}
          labels={labels}
          classNameToolbar={classNameToolbar}
          styles={stylesProp}
          compact={compact}
        />
      </div>

      <div
        style={
          modal
            ? {
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }
            : { display: "contents" }
        }
      >
      <div style={mainRowStyle(modal)}>
        {batchPreviewEntries.length > 0 ? (
          <div style={batchStripStyle(compact)}>
            {batchPreviewEntries.map(({ i, url, label }) => (
              <button
                key={`${url}-${i}`}
                type="button"
                className={rpBtnSurface}
                onClick={() => setBatchIndex(i)}
                style={{
                  padding: "var(--rp-space-1)",
                  border:
                    i === batchIndex
                      ? "2px solid var(--rp-primary)"
                      : "1px solid var(--rp-border)",
                  borderRadius: "var(--rp-radius-sm)",
                  background: "var(--rp-surface)",
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
                    borderRadius: "var(--rp-radius-sm)",
                  }}
                />
              </button>
            ))}
          </div>
        ) : null}

        <div style={canvasColumnStyle(sidebarActive, modal)}>
          <div
            className={classNameCanvasWrapper}
            style={{
              ...canvasWrapperOuterStyle,
              minHeight: canvasScrollPort
                ? canvasScrollPort.height + 24
                : compact
                  ? 200
                  : 280,
              ...stylesProp?.canvasWrapper,
            }}
          >
            {!baseURL ? (
              <div
                role="region"
                aria-label={labels.selectOrUpload}
                aria-describedby={`${emptyUploadInputId}-hint`}
                tabIndex={0}
                onDragEnter={onEmptyStateDragEnter}
                onDragLeave={onEmptyStateDragLeave}
                onDragOver={onEmptyStateDragOver}
                onDrop={onEmptyStateDrop}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    emptyUploadInputRef.current?.click();
                  }
                }}
                style={{
                  minHeight: compact ? 200 : 320,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "var(--rp-space-4)",
                  padding: "var(--rp-space-5)",
                  borderRadius: "var(--rp-radius-md)",
                  border: `2px dashed ${
                    emptyStateDragActive
                      ? "var(--rp-primary)"
                      : "var(--rp-border)"
                  }`,
                  background: emptyStateDragActive
                    ? "color-mix(in srgb, var(--rp-primary) 10%, transparent)"
                    : "var(--rp-surface)",
                  color: "var(--rp-text-muted)",
                  fontSize: "var(--rp-font-size-md)",
                  fontFamily: "var(--rp-font-family)",
                  textAlign: "center",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    color: "var(--rp-text)",
                    fontSize: "var(--rp-font-size-md)",
                    maxWidth: 360,
                    lineHeight: 1.5,
                    fontFamily: "var(--rp-font-family)",
                  }}
                >
                  {labels.selectOrUpload}
                </span>
                <span
                  id={`${emptyUploadInputId}-hint`}
                  style={{
                    fontSize: "var(--rp-font-size-sm)",
                    fontFamily: "var(--rp-font-family)",
                  }}
                >
                  {labels.dropImageHint}
                </span>
                <input
                  ref={emptyUploadInputRef}
                  id={emptyUploadInputId}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={onPickFile}
                  aria-hidden
                />
                <button
                  type="button"
                  className={rpBtnOutline}
                  style={{
                    ...outlineBtn,
                    minHeight: compact ? 44 : undefined,
                  }}
                  onClick={() => emptyUploadInputRef.current?.click()}
                >
                  {labels.upload}
                </button>
              </div>
            ) : isLoading ? (
              <div style={loadingCanvasPlaceholderStyle}>
                {labels.processing ?? "Loading…"}
              </div>
            ) : (
              <>
                {cropMetricsHint}
                <div
                  className={
                    canvasScrollPort ? classNameCanvasScrollArea : undefined
                  }
                  style={
                    canvasScrollPort
                      ? {
                          width: canvasScrollPort.width,
                          height: canvasScrollPort.height,
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
                  <div style={viewportHintStyle}>
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
            setCropModeTypeAndAspect={setCropModeTypeAndAspect}
            aspect={aspect}
            setAspect={setAspect}
            cropRect={cropRect}
            onApplyCrop={onApplyCrop}
            onClearCrop={onClearCrop}
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
            onApplyResize={onApplyResize}
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
            onApplyScale={onApplyScale}
            labels={labels}
            baseURL={baseURL}
            compact={compact}
          />
        )}

        {activeTab === FILTERS_TAB_ID && showFiltersTab && (
          <FiltersSidebar
            filter={filter}
            setFilter={setFilter}
            onApplyFilters={onApplyFiltersAction}
            onResetFilters={onResetFiltersToDefault}
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
            style={{ ...sidebarShellStyle, ...customTabPanelStyle }}
          >
            {customTab.content}
          </div>
        )}
      </div>
      </div>

      <div style={modal ? { flexShrink: 0 } : { display: "contents" }}>
      <HistoryPanel
        history={history}
        onJumpTo={jumpToHistory}
        labels={labels}
        expanded={historyPanelOpen}
        onToggle={() => setHistoryPanelOpen((v) => !v)}
      />
      </div>

      <div style={modal ? { flexShrink: 0 } : { display: "contents" }}>
      <EditorFooter
        historyLength={history.length}
        redoLength={redoStack.length}
        onUndo={undo}
        onRedo={redoAction}
        onCancel={onCancel}
        onSave={onSave}
        labels={labels}
        onToggleHistory={() => setHistoryPanelOpen((v) => !v)}
        historyPanelOpen={historyPanelOpen}
        showBatchApply={batchItems.length > 1}
        onBatchApplyAll={onBatchApplyAllClick}
        batchApplyDisabled={
          processing ||
          isLoading ||
          (activeTab !== "resize" && activeTab !== "scale") ||
          (activeTab === "resize" && !batchResizeValid)
        }
        compact={compact}
      />
      </div>
      </div>
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
          ...inlineCardStyle,
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
      width: "min(1040px, calc(100vw - 32px))",
      height: "min(900px, calc(100vh - 32px))",
      maxHeight: "calc(100vh - 32px)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      boxSizing: "border-box",
      position: "relative",
      boxShadow: "var(--rp-shadow)",
      border: "1px solid var(--rp-border)",
      borderRadius: "var(--rp-radius-lg)",
      padding: "var(--rp-space-4)",
      background: "var(--rp-surface)",
      fontFamily: "var(--rp-font-family)",
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
            padding: "var(--rp-space-4)",
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
