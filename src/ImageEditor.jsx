import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * ImageEditor – React image editor using only React + native Canvas API
 * Features: crop (free + aspect), rotate, flip, scale, undo/redo, export as Blob
 * Dependencies: React only (no konva, use-image, etc.)
 */

// ---------- Helpers ----------
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function dataUrlToBlob(dataUrl) {
  const [meta, b64] = dataUrl.split(",");
  const mime = /data:(.*);base64/.exec(meta)?.[1] || "image/png";
  const bin = atob(b64);
  const len = bin.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function clampRectToViewport(rect, viewport) {
  const width = clamp(rect.width, 10, viewport.w);
  const height = clamp(rect.height, 10, viewport.h);
  const x = clamp(rect.x, 0, viewport.w - width);
  const y = clamp(rect.y, 0, viewport.h - height);
  return { x, y, width, height };
}

function normalizeFromPoints(sx, sy, px, py, aspect) {
  let w = Math.abs(px - sx);
  let h = Math.abs(py - sy);
  if (aspect && aspect > 0) {
    if (w / (h || 1) > aspect) h = w / aspect;
    else w = h * aspect;
  }
  const x = px >= sx ? sx : sx - w;
  const y = py >= sy ? sy : sy - h;
  return { x, y, width: w, height: h };
}

const CROP_HANDLE_SIZE = 10;

function getCropRectNormalized(cropRect) {
  if (!cropRect || (cropRect.width === 0 && cropRect.height === 0)) return null;
  const x = Math.min(cropRect.x, cropRect.x + cropRect.width);
  const y = Math.min(cropRect.y, cropRect.y + cropRect.height);
  const width = Math.abs(cropRect.width);
  const height = Math.abs(cropRect.height);
  return { x, y, width, height };
}

function hitTestCropHandle(px, py, cropRect, handleSize) {
  const r = getCropRectNormalized(cropRect);
  if (!r) return null;
  const half = handleSize / 2;
  const { x, y, width, height } = r;
  const corners = [
    ["nw", x, y],
    ["ne", x + width, y],
    ["se", x + width, y + height],
    ["sw", x, y + height],
  ];
  for (const [handle, hx, hy] of corners) {
    if (px >= hx - half && px <= hx + half && py >= hy - half && py <= hy + half) return handle;
  }
  const midX = x + width / 2;
  const midY = y + height / 2;
  if (py >= y - half && py <= y + half && px >= x + half && px <= x + width - half) return "n";
  if (px >= x + width - half && px <= x + width + half && py >= y + half && py <= y + height - half) return "e";
  if (py >= y + height - half && py <= y + height + half && px >= x + half && px <= x + width - half) return "s";
  if (px >= x - half && px <= x + half && py >= y + half && py <= y + height - half) return "w";
  if (px >= x && px <= x + width && py >= y && py <= y + height) return "center";
  return null;
}

function resizeCropRectFromHandle(handle, drawX, drawY, drawW, drawH, posX, posY, aspect, viewport) {
  let x, y, w, h;
  switch (handle) {
    case "se":
      x = drawX;
      y = drawY;
      w = posX - drawX;
      h = posY - drawY;
      break;
    case "sw":
      x = posX;
      y = drawY;
      w = drawX + drawW - posX;
      h = posY - drawY;
      break;
    case "nw":
      x = posX;
      y = posY;
      w = drawX + drawW - posX;
      h = drawY + drawH - posY;
      break;
    case "ne":
      x = drawX;
      y = posY;
      w = posX - drawX;
      h = drawY + drawH - posY;
      break;
    case "n":
      x = drawX;
      y = posY;
      w = drawW;
      h = drawY + drawH - posY;
      break;
    case "s":
      x = drawX;
      y = drawY;
      w = drawW;
      h = posY - drawY;
      break;
    case "e":
      x = drawX;
      y = drawY;
      w = posX - drawX;
      h = drawH;
      break;
    case "w":
      x = posX;
      y = drawY;
      w = drawX + drawW - posX;
      h = drawH;
      break;
    default:
      return null;
  }
  if (handle === "n" || handle === "s") {
    if (h < 0) {
      y = handle === "n" ? drawY + drawH : drawY + h;
      h = Math.abs(h);
    }
  } else if (handle === "e" || handle === "w") {
    if (w < 0) {
      x = handle === "w" ? drawX + drawW : drawX + w;
      w = Math.abs(w);
    }
  } else {
    x = Math.min(x, x + w);
    y = Math.min(y, y + h);
    w = Math.abs(w);
    h = Math.abs(h);
  }
  if (handle !== "n" && handle !== "s" && handle !== "e" && handle !== "w") {
    w = Math.abs(w);
    h = Math.abs(h);
  }
  if (aspect && aspect > 0) {
    if (w / (h || 1) > aspect) h = w / aspect;
    else w = h * aspect;
    switch (handle) {
      case "se":
        break;
      case "sw":
        x = drawX + drawW - w;
        break;
      case "nw":
        x = drawX + drawW - w;
        y = drawY + drawH - h;
        break;
      case "ne":
        y = drawY + drawH - h;
        break;
      case "n":
        y = drawY + drawH - h;
        break;
      case "s":
        break;
      case "e":
        break;
      case "w":
        x = drawX + drawW - w;
        break;
    }
  }
  return clampRectToViewport({ x, y, width: w, height: h }, viewport);
}

// Theme tokens – consumers can override via CSS variables on .react-pixcraft-editor
const LIGHT_VARS = {
  "--rp-bg": "#ffffff",
  "--rp-surface": "#f6f8fa",
  "--rp-border": "#d0d7de",
  "--rp-text": "#24292f",
  "--rp-text-muted": "#57606a",
  "--rp-primary": "#218bff",
  "--rp-primary-hover": "#0969da",
  "--rp-input-bg": "#ffffff",
  "--rp-overlay": "rgba(0,0,0,0.6)",
  "--rp-shadow": "0 25px 50px -12px rgba(0,0,0,0.25)",
  "--rp-checker": "#eee",
};
const DARK_VARS = {
  "--rp-bg": "#1c2128",
  "--rp-surface": "#21262d",
  "--rp-border": "#373e47",
  "--rp-text": "#e6edf3",
  "--rp-text-muted": "#8b949e",
  "--rp-primary": "#58a6ff",
  "--rp-primary-hover": "#79b8ff",
  "--rp-input-bg": "#0d1117",
  "--rp-overlay": "rgba(0,0,0,0.75)",
  "--rp-shadow": "0 25px 50px -12px rgba(0,0,0,0.5)",
  "--rp-checker": "#30363d",
};

const DEFAULT_LABELS = {
  title: "Image editor",
  close: "Close",
  crop: "Crop",
  rotateLeft: "Rotate 90° left",
  rotateRight: "Rotate 90° right",
  rotate180: "Rotate 180°",
  flipVertical: "Flip vertical",
  flipHorizontal: "Flip horizontal",
  undo: "Undo",
  redo: "Redo",
  cancelEditing: "Cancel editing",
  applyCrop: "Apply crop",
  clearCrop: "Clear crop",
  upload: "Upload",
  save: "Save",
  scale: "Scale",
  width: "Width",
  height: "Height",
  aspectRatio: "Aspect ratio (e.g. 16/9)",
  selectOrUpload: "Select or upload an image to begin",
  imageLoaded: "Image loaded",
  originalDimensions: "Original",
  currentView: "View",
};

export default function ImageEditor({
  src,
  maxViewport = DEFAULT_VIEWPORT,
  onExport,
  onClose,
  mime = "image/png",
  className,
  modal = true,
  theme = "light",
  labels: labelsProp,
  classNameToolbar,
  classNameCanvasWrapper,
  classNameModal,
  classNameOverlay,
  styles: stylesProp,
}) {
  const canvasRef = useRef(null);
  const modalContentRef = useRef(null);
  const [open, setOpen] = useState(true);
  const [baseURL, setBaseURL] = useState(src ?? null);
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...labelsProp }), [labelsProp]);

  const [resolvedTheme, setResolvedTheme] = useState(theme === "auto" ? null : theme);
  useEffect(() => {
    if (theme !== "auto") {
      setResolvedTheme(theme);
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setResolvedTheme(mq.matches ? "dark" : "light");
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  const themeVars = useMemo(
    () => (resolvedTheme === "dark" ? DARK_VARS : LIGHT_VARS),
    [resolvedTheme]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);
  const [loadedImg, setLoadedImg] = useState(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState({ x: false, y: false });

  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  const [aspect, setAspect] = useState(undefined);

  const [scaleW, setScaleW] = useState("");
  const [scaleH, setScaleH] = useState("");

  const [history, setHistory] = useState([]);
  const [redo, setRedo] = useState([]);

  const fileInputRef = useRef(null);
  const scaleInputRef = useRef({ width: false, height: false });

  const isDrawingRef = useRef(false);
  const startPointRef = useRef(null);
  const dragStartRef = useRef(null);
  const resizeHandleRef = useRef(null);

  const viewport = useMemo(() => {
    const imgW = imgSize.width || 1;
    const imgH = imgSize.height || 1;
    const maxW = maxViewport.width;
    const maxH = maxViewport.height;
    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    const w = Math.round(imgW * scale);
    const h = Math.round(imgH * scale);
    return { w, h, scale };
  }, [imgSize, maxViewport.width, maxViewport.height]);

  // Load image when baseURL changes
  useEffect(() => {
    if (!baseURL) {
      setLoadedImg(null);
      setImgSize({ width: 0, height: 0 });
      return;
    }
    loadImage(baseURL)
      .then((img) => {
        setLoadedImg(img);
        setImgSize({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
      })
      .catch(() => {
        setLoadedImg(null);
        setImgSize({ width: 0, height: 0 });
      });
  }, [baseURL]);

  useEffect(() => {
    setRotation(0);
    setFlip({ x: false, y: false });
    setCropMode(false);
    setCropRect(null);
    setScaleW("");
    setScaleH("");
    scaleInputRef.current = { width: false, height: false };
  }, [baseURL]);

  useEffect(() => {
    if (!modal || !open) return;
    const onKeyDown = (e) => {
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
      const focusables = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusables[0];
      if (first && typeof first.focus === "function") first.focus();
    });
    return () => cancelAnimationFrame(timer);
  }, [modal, open]);

  const originalAspectRatio = useMemo(() => {
    if (imgSize.width && imgSize.height) return imgSize.width / imgSize.height;
    if (viewport.w > 0 && viewport.h > 0) return viewport.w / viewport.h;
    return null;
  }, [imgSize, viewport]);

  const pushHistory = useCallback((url, w, h) => {
    setHistory((hstack) => [...hstack, { dataURL: url, width: w, height: h }]);
    setRedo([]);
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setRedo((r) => [...r, { dataURL: baseURL, width: imgSize.width, height: imgSize.height }]);
      setBaseURL(prev.dataURL);
      return h.slice(0, -1);
    });
  }, [baseURL, imgSize]);

  const redoAction = useCallback(() => {
    setRedo((r) => {
      if (r.length === 0) return r;
      const next = r[0];
      setHistory((h) => [...h, { dataURL: baseURL, width: imgSize.width, height: imgSize.height }]);
      setBaseURL(next.dataURL);
      return r.slice(1);
    });
  }, [baseURL, imgSize]);

  // Draw image with rotation and flip onto canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = loadedImg;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    const { w, h, scale } = viewport;

    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    ctx.save();

    ctx.translate(w / 2, h / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
    ctx.translate(-w / 2, -h / 2);

    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const ox = (w - drawW) / 2;
    const oy = (h - drawH) / 2;
    ctx.drawImage(img, 0, 0, imgW, imgH, ox, oy, drawW, drawH);

    ctx.restore();

    // Draw crop overlay only outside the crop rect (so the selected area stays visible)
    if (cropRect && (cropRect.width !== 0 || cropRect.height !== 0)) {
      const drawX = Math.min(cropRect.x, cropRect.x + cropRect.width);
      const drawY = Math.min(cropRect.y, cropRect.y + cropRect.height);
      const drawW = Math.abs(cropRect.width);
      const drawH = Math.abs(cropRect.height);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.rect(drawX, drawY, drawW, drawH);
      ctx.fill("evenodd");
      ctx.strokeStyle = resolvedTheme === "dark" ? "#58a6ff" : "#218bff";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(drawX, drawY, drawW, drawH);
      ctx.setLineDash([]);
      const handleColor = resolvedTheme === "dark" ? "#58a6ff" : "#218bff";
      const hs = CROP_HANDLE_SIZE / 2;
      const handles = [
        [drawX, drawY],
        [drawX + drawW, drawY],
        [drawX + drawW, drawY + drawH],
        [drawX, drawY + drawH],
        [drawX + drawW / 2, drawY],
        [drawX + drawW, drawY + drawH / 2],
        [drawX + drawW / 2, drawY + drawH],
        [drawX, drawY + drawH / 2],
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

  const commitCurrentViewToBitmap = useCallback(
    async (targetW, targetH) => {
      const img = loadedImg;
      if (!img) return;

      const { w, h, scale } = viewport;
      const imgW = img.naturalWidth || img.width;
      const imgH = img.naturalHeight || img.height;
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const ox = (w - drawW) / 2;
      const oy = (h - drawH) / 2;

      const temp = document.createElement("canvas");
      temp.width = w;
      temp.height = h;
      const tctx = temp.getContext("2d");
      tctx.save();
      tctx.translate(w / 2, h / 2);
      tctx.rotate((rotation * Math.PI) / 180);
      tctx.scale(flip.x ? -1 : 1, flip.y ? -1 : 1);
      tctx.translate(-w / 2, -h / 2);
      tctx.drawImage(img, 0, 0, imgW, imgH, ox, oy, drawW, drawH);
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
          outH = targetH;
          outW = Math.round(targetH * (w / h));
        }
      }

      const offscreen = document.createElement("canvas");
      offscreen.width = outW;
      offscreen.height = outH;
      const octx = offscreen.getContext("2d");
      octx.drawImage(temp, 0, 0, w, h, 0, 0, outW, outH);

      const dataURL = offscreen.toDataURL(mime);
      const decoded = await loadImage(dataURL);
      pushHistory(baseURL || dataURL, imgSize.width, imgSize.height);
      setBaseURL(dataURL);
      setImgSize({ width: decoded.width, height: decoded.height });
      setRotation(0);
      setFlip({ x: false, y: false });
    },
    [loadedImg, viewport, rotation, flip, baseURL, imgSize, mime, pushHistory]
  );

  const rotateLeft = () => {
    setRotation((d) => (d - 90 + 360) % 360);
    requestAnimationFrame(() => commitCurrentViewToBitmap());
  };
  const rotateRight = () => {
    setRotation((d) => (d + 90) % 360);
    requestAnimationFrame(() => commitCurrentViewToBitmap());
  };
  const rotate180 = () => {
    setRotation((d) => (d + 180) % 360);
    requestAnimationFrame(() => commitCurrentViewToBitmap());
  };
  const flipH = () => {
    setFlip((f) => ({ ...f, x: !f.x }));
    requestAnimationFrame(() => commitCurrentViewToBitmap());
  };
  const flipV = () => {
    setFlip((f) => ({ ...f, y: !f.y }));
    requestAnimationFrame(() => commitCurrentViewToBitmap());
  };

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onCanvasMouseDown = (e) => {
    const pos = getCanvasPoint(e);
    if (!pos) return;

    if (cropMode) {
      if (cropRect && (cropRect.width !== 0 || cropRect.height !== 0)) {
        const hit = hitTestCropHandle(pos.x, pos.y, cropRect, CROP_HANDLE_SIZE);
        if (hit === "nw" || hit === "ne" || hit === "se" || hit === "sw" || hit === "n" || hit === "e" || hit === "s" || hit === "w") {
          resizeHandleRef.current = hit;
          return;
        }
        if (hit === "center") {
          const r = getCropRectNormalized(cropRect);
          dragStartRef.current = {
            x: pos.x - r.x,
            y: pos.y - r.y,
            rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          };
          return;
        }
      }
      isDrawingRef.current = true;
      startPointRef.current = pos;
      setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const onCanvasMouseMove = (e) => {
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
      const nx = pos.x - dx;
      const ny = pos.y - dy;
      const clamped = clampRectToViewport(
        { ...rect, x: nx, y: ny },
        viewport
      );
      setCropRect(clamped);
    } else if (cropMode && canvasRef.current && cropRect && (cropRect.width !== 0 || cropRect.height !== 0)) {
      const hit = hitTestCropHandle(pos.x, pos.y, cropRect, CROP_HANDLE_SIZE);
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
  };

  const clearDragState = useCallback(() => {
    isDrawingRef.current = false;
    startPointRef.current = null;
    dragStartRef.current = null;
    resizeHandleRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "";
  }, []);

  const onCanvasMouseUp = () => {
    clearDragState();
  };

  const onCanvasMouseLeave = () => {
    clearDragState();
  };

  useEffect(() => {
    if (!cropMode) return;
    const onWindowMouseUp = () => {
      isDrawingRef.current = false;
      startPointRef.current = null;
      dragStartRef.current = null;
      resizeHandleRef.current = null;
      if (canvasRef.current) canvasRef.current.style.cursor = "";
    };
    window.addEventListener("mouseup", onWindowMouseUp);
    return () => window.removeEventListener("mouseup", onWindowMouseUp);
  }, [cropMode]);

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
    const octx = offscreen.getContext("2d");
    octx.drawImage(temp, x, y, cw, ch, 0, 0, cw, ch);

    const dataURL = offscreen.toDataURL(mime);
    const img = await loadImage(dataURL);
    pushHistory(baseURL || dataURL, imgSize.width, imgSize.height);
    setBaseURL(dataURL);
    setImgSize({ width: img.width, height: img.height });
    setCropRect(null);
    setCropMode(false);
  }, [loadedImg, cropRect, viewport, rotation, flip, baseURL, imgSize, mime, pushHistory]);

  const clearCrop = () => setCropRect(null);

  const onScale = async () => {
    const w = parseInt(scaleW || "0", 10);
    const h = parseInt(scaleH || "0", 10);
    if (!w && !h) return;
    await commitCurrentViewToBitmap(w || undefined, h || undefined);
    setScaleW("");
    setScaleH("");
  };

  const onSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL(mime);
    const blob = dataUrlToBlob(dataURL);
    onExport?.(blob, { width: viewport.w, height: viewport.h, mime });
  };

  const onCancel = () => {
    if (history.length === 0) return;
    const first = history[0];
    setBaseURL(first.dataURL);
    setHistory([]);
    setRedo([]);
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBaseURL(URL.createObjectURL(file));
    setHistory([]);
    setRedo([]);
  };

  const originalSize = `${imgSize.width} × ${imgSize.height}`;
  const currentSize = `${viewport.w} × ${viewport.h}`;
  const isLoading = Boolean(baseURL && !loadedImg);

  const baseBtn = {
    padding: "8px 12px",
    border: "1px solid var(--rp-border)",
    background: "var(--rp-surface)",
    color: "var(--rp-text)",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  };
  const primaryBtn = {
    ...baseBtn,
    border: "1px solid var(--rp-primary)",
    background: "var(--rp-primary)",
    color: "white",
  };
  const btnDisabled = (disabled) => ({
    ...baseBtn,
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  });
  const inputStyle = {
    padding: 8,
    border: "1px solid var(--rp-border)",
    borderRadius: 6,
    fontSize: 14,
    background: "var(--rp-input-bg)",
    color: "var(--rp-text)",
    width: "100%",
  };

  const editorContent = (
    <div
      className={`react-pixcraft-editor ${className || ""}`.trim()}
      style={{ ...themeVars, ...stylesProp?.root }}
      data-theme={resolvedTheme ?? "light"}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <h2 id="react-pixcraft-title" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--rp-text)" }}>
            {labels.title}
          </h2>
          <span style={{ fontSize: 13, color: "var(--rp-text-muted)" }}>
            {baseURL ? (isLoading ? "Loading…" : labels.imageLoaded) : labels.selectOrUpload}
          </span>
        </div>

        {/* Toolbar: all actions in one place */}
        <div
          className={classNameToolbar}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
            marginBottom: 12,
            ...stylesProp?.toolbar,
          }}
        >
          <button type="button" style={baseBtn} onClick={() => setCropMode((v) => !v)} aria-pressed={cropMode}>
            {labels.crop}
          </button>
          <button type="button" style={baseBtn} onClick={rotateLeft}>{labels.rotateLeft}</button>
          <button type="button" style={baseBtn} onClick={rotateRight}>{labels.rotateRight}</button>
          <button type="button" style={baseBtn} onClick={rotate180}>{labels.rotate180}</button>
          <button type="button" style={baseBtn} onClick={flipV}>{labels.flipVertical}</button>
          <button type="button" style={baseBtn} onClick={flipH}>{labels.flipHorizontal}</button>
          <span style={{ margin: "0 4px", color: "var(--rp-text-muted)", opacity: 0.6 }} aria-hidden>|</span>
          <button type="button" style={btnDisabled(!history.length)} onClick={undo} disabled={!history.length}>{labels.undo}</button>
          <button type="button" style={btnDisabled(!redo.length)} onClick={redoAction} disabled={!redo.length}>{labels.redo}</button>
          <button type="button" style={btnDisabled(!history.length)} onClick={onCancel} disabled={!history.length}>{labels.cancelEditing}</button>
          {cropRect ? (
            <>
              <button type="button" style={primaryBtn} onClick={applyCrop}>{labels.applyCrop}</button>
              <button type="button" style={baseBtn} onClick={clearCrop}>{labels.clearCrop}</button>
            </>
          ) : null}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickFile} aria-hidden />
            <button type="button" style={baseBtn} onClick={() => fileInputRef.current?.click()}>{labels.upload}</button>
            <button type="button" style={primaryBtn} onClick={onSave}>{labels.save}</button>
          </div>
        </div>

        {/* Options row: aspect ratio (when crop) + scale */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 12 }}>
          {cropMode && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--rp-text-muted)", whiteSpace: "nowrap" }}>{labels.aspectRatio}</label>
              <input
                style={{ ...inputStyle, width: 120 }}
                placeholder="e.g. 16/9"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (!v) return setAspect(undefined);
                  let val = Number(v);
                  if (Number.isNaN(val) && v.includes("/")) {
                    const [a, b] = v.split("/").map(Number);
                    if (!Number.isNaN(a) && !Number.isNaN(b) && b !== 0) val = a / b;
                  }
                  setAspect(!Number.isNaN(val) && val > 0 ? val : undefined);
                }}
              />
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--rp-text-muted)" }}>
              {labels.originalDimensions} {originalSize} · {labels.currentView} {currentSize}
            </span>
            <label style={{ fontSize: 12, color: "var(--rp-text-muted)" }}>{labels.width}</label>
            <input
              style={{ ...inputStyle, width: 72 }}
              value={scaleW}
              onFocus={() => { scaleInputRef.current.width = true; scaleInputRef.current.height = false; }}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                scaleInputRef.current.width = true;
                scaleInputRef.current.height = false;
                setScaleW(value);
                if (value && originalAspectRatio > 0) {
                  const w = parseInt(value, 10);
                  if (!Number.isNaN(w) && w > 0) setScaleH(Math.round(w / originalAspectRatio).toString());
                } else if (!value) setScaleH("");
              }}
              placeholder="px"
              disabled={!baseURL}
            />
            <label style={{ fontSize: 12, color: "var(--rp-text-muted)" }}>{labels.height}</label>
            <input
              style={{ ...inputStyle, width: 72 }}
              value={scaleH}
              onFocus={() => { scaleInputRef.current.width = false; scaleInputRef.current.height = true; }}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                scaleInputRef.current.width = false;
                scaleInputRef.current.height = true;
                setScaleH(value);
                if (value && originalAspectRatio > 0) {
                  const h = parseInt(value, 10);
                  if (!Number.isNaN(h) && h > 0) setScaleW(Math.round(h * originalAspectRatio).toString());
                } else if (!value) setScaleW("");
              }}
              placeholder="px"
              disabled={!baseURL}
            />
            <button type="button" style={btnDisabled(!baseURL)} onClick={onScale} disabled={!baseURL}>{labels.scale}</button>
          </div>
        </div>

        {/* Canvas area – full width, responsive */}
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
            <canvas
              ref={canvasRef}
              width={viewport.w}
              height={viewport.h}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={onCanvasMouseLeave}
              style={{
                display: "block",
                margin: "0 auto",
                maxWidth: "100%",
                height: "auto",
                backgroundImage: "linear-gradient(45deg, var(--rp-checker) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--rp-checker) 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 8px 8px",
                borderRadius: 8,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (!open) return null;
  if (modal) {
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
        aria-modal="true"
        role="dialog"
        aria-labelledby="react-pixcraft-title"
      >
        <div
          className={classNameModal}
          ref={modalContentRef}
          style={{
            background: "var(--rp-bg)",
            borderRadius: 12,
            padding: 0,
            maxWidth: "95vw",
            maxHeight: "95vh",
            overflow: "auto",
            position: "relative",
            boxShadow: "var(--rp-shadow)",
            ...themeVars,
            ...stylesProp?.modal,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={labels.close}
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              border: "none",
              background: "var(--rp-surface)",
              color: "var(--rp-text)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 20,
              lineHeight: 1,
              zIndex: 1,
            }}
          >
            ×
          </button>
          <div style={{ padding: 16 }}>{editorContent}</div>
        </div>
      </div>
    );
  }
  return editorContent;
}
