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
    console.log("url", url);
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

const ui = {
  btn: {
    padding: "8px 12px",
    border: "1px solid #d0d7de",
    background: "#f6f8fa",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  btnPrimary: {
    padding: "8px 12px",
    border: "1px solid #1f6feb",
    background: "#2f81f7",
    color: "white",
    borderRadius: 6,
    cursor: "pointer",
  },
  input: {
    padding: 8,
    border: "1px solid #d0d7de",
    borderRadius: 6,
    fontSize: 14,
    width: "100%",
  },
  label: { fontSize: 12, color: "#57606a" },
  card: {
    border: "1px solid #d0d7de",
    borderRadius: 12,
    padding: 16,
    background: "white",
  },
  heading: { margin: 0, fontSize: 16, fontWeight: 600 },
  small: { fontSize: 12, color: "#57606a" },
};

const btnWithDisabled = (disabled) => ({
  ...ui.btn,
  opacity: disabled ? 0.5 : 1,
  cursor: disabled ? "not-allowed" : "pointer",
});

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const modalBoxStyle = {
  background: "white",
  borderRadius: 12,
  padding: 0,
  maxWidth: "95vw",
  maxHeight: "95vh",
  overflow: "auto",
  position: "relative",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
};

export default function ImageEditor({
  src,
  maxViewport = DEFAULT_VIEWPORT,
  onExport,
  onClose,
  mime = "image/png",
  className,
  modal = true,
}) {
  const canvasRef = useRef(null);
  const [open, setOpen] = useState(true);
  const [baseURL, setBaseURL] = useState(src ?? null);

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

    // Draw crop overlay and rect (use normalized rect so negative width/height still clear correctly)
    if (cropRect && (cropRect.width !== 0 || cropRect.height !== 0)) {
      const drawX = Math.min(cropRect.x, cropRect.x + cropRect.width);
      const drawY = Math.min(cropRect.y, cropRect.y + cropRect.height);
      const drawW = Math.abs(cropRect.width);
      const drawH = Math.abs(cropRect.height);
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, w, h);
      ctx.clearRect(drawX, drawY, drawW, drawH);
      ctx.strokeStyle = "#2f81f7";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(drawX, drawY, drawW, drawH);
    }
  }, [loadedImg, viewport, rotation, flip, cropRect]);

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
      if (cropRect && pos.x >= cropRect.x && pos.x <= cropRect.x + cropRect.width && pos.y >= cropRect.y && pos.y <= cropRect.y + cropRect.height) {
        dragStartRef.current = { x: pos.x - cropRect.x, y: pos.y - cropRect.y, rect: { ...cropRect } };
        return;
      }
      isDrawingRef.current = true;
      startPointRef.current = pos;
      setCropRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const onCanvasMouseMove = (e) => {
    const pos = getCanvasPoint(e);
    if (!pos) return;

    if (cropMode && isDrawingRef.current && startPointRef.current) {
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
    }
  };

  const onCanvasMouseUp = () => {
    isDrawingRef.current = false;
    startPointRef.current = null;
    dragStartRef.current = null;
  };

  const onCanvasMouseLeave = () => {
    onCanvasMouseUp();
  };

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

  const editorContent = (
    <div className={className || ""}>
      <div style={{ ...ui.card, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <h3 style={ui.heading}>Attachment details</h3>
          <div style={ui.small}>{baseURL ? "Image loaded" : "Choose an image"}</div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <button style={ui.btn} onClick={() => setCropMode((v) => !v)}>Crop</button>
          <button style={ui.btn} onClick={rotateLeft}>Rotate 90° left</button>
          <button style={ui.btn} onClick={rotateRight}>Rotate 90° right</button>
          <button style={ui.btn} onClick={rotate180}>Rotate 180°</button>
          <button style={ui.btn} onClick={flipV}>Flip vertical</button>
          <button style={ui.btn} onClick={flipH}>Flip horizontal</button>
          <span style={{ margin: "0 6px", opacity: 0.4 }}>|</span>
          <button style={btnWithDisabled(!history.length)} onClick={undo} disabled={!history.length}>Undo</button>
          <button style={btnWithDisabled(!redo.length)} onClick={redoAction} disabled={!redo.length}>Redo</button>
          <button style={btnWithDisabled(!history.length)} onClick={onCancel} disabled={!history.length}>Cancel Editing</button>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {cropRect ? <button style={ui.btnPrimary} onClick={applyCrop}>Apply Crop</button> : null}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPickFile} />
            <button style={ui.btn} onClick={() => fileInputRef.current?.click()}>Upload</button>
            <button style={ui.btnPrimary} onClick={onSave}>Save Edits</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
          <div style={{ border: "1px solid #d0d7de", borderRadius: 12, padding: 8, background: "#f8fafc" }}>
            {!baseURL ? (
              <div style={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center", color: "#57606a", fontSize: 14 }}>
                Select or upload an image to begin.
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
                  backgroundImage: "linear-gradient(45deg,#eee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#eee 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0,8px 8px",
                  borderRadius: 8,
                }}
              />
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={ui.card}>
              <h4 style={ui.heading}>Scale image</h4>
              <div style={{ ...ui.small, marginTop: 6 }}>Original dimensions {originalSize}</div>
              <div style={ui.small}>Current view {currentSize}</div>
              <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: 8, marginTop: 8 }}>
                <label style={ui.label}>Width</label>
                <input
                  style={ui.input}
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
                />
                <label style={ui.label}>Height</label>
                <input
                  style={ui.input}
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
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <button style={ui.btn} onClick={onScale}>Scale</button>
              </div>
            </div>

            <div style={ui.card}>
              <h4 style={ui.heading}>Crop image</h4>
              <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 8, marginTop: 8 }}>
                <label style={ui.label}>Aspect ratio</label>
                <input
                  style={ui.input}
                  placeholder="e.g. 16/9 or 1.333"
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
                <label style={ui.label}>Start (x, y)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="number"
                    style={ui.input}
                    disabled={!cropRect}
                    value={cropRect ? Math.round(cropRect.x) : ""}
                    onChange={(e) => {
                      if (!cropRect) return;
                      setCropRect((r) => clampRectToViewport({ ...r, x: parseInt(e.target.value || "0", 10) }, viewport));
                    }}
                  />
                  <input
                    type="number"
                    style={ui.input}
                    disabled={!cropRect}
                    value={cropRect ? Math.round(cropRect.y) : ""}
                    onChange={(e) => {
                      if (!cropRect) return;
                      setCropRect((r) => clampRectToViewport({ ...r, y: parseInt(e.target.value || "0", 10) }, viewport));
                    }}
                  />
                </div>
                <label style={ui.label}>Selection (w × h)</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input
                    type="number"
                    min={10}
                    style={ui.input}
                    disabled={!cropRect}
                    value={cropRect ? Math.round(cropRect.width) : ""}
                    onChange={(e) => {
                      if (!cropRect) return;
                      let w = Math.max(10, parseInt(e.target.value || "0", 10));
                      let h = cropRect.height;
                      if (aspect > 0) h = Math.round(w / aspect);
                      setCropRect((r) => clampRectToViewport({ ...r, width: w, height: h }, viewport));
                    }}
                  />
                  <input
                    type="number"
                    min={10}
                    style={ui.input}
                    disabled={!cropRect}
                    value={cropRect ? Math.round(cropRect.height) : ""}
                    onChange={(e) => {
                      if (!cropRect) return;
                      let h = Math.max(10, parseInt(e.target.value || "0", 10));
                      let w = cropRect.width;
                      if (aspect > 0) w = Math.round(h * aspect);
                      setCropRect((r) => clampRectToViewport({ ...r, width: w, height: h }, viewport));
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button style={{ ...ui.btn, flex: 1 }} disabled={!cropRect} onClick={applyCrop}>Apply Crop</button>
                <button style={{ ...ui.btn, flex: 1 }} disabled={!cropRect} onClick={clearCrop}>Clear Crop</button>
              </div>
            </div>

            <div style={ui.card}>
              <h4 style={ui.heading}>Rotation & Flip</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <button style={ui.btn} onClick={rotateLeft}>Rotate 90° left</button>
                <button style={ui.btn} onClick={rotateRight}>Rotate 90° right</button>
                <button style={{ ...ui.btn, gridColumn: "1 / span 2" }} onClick={rotate180}>Rotate 180°</button>
                <button style={ui.btn} onClick={flipV}>Flip vertical</button>
                <button style={ui.btn} onClick={flipH}>Flip horizontal</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!open) return null;
  if (modal) {
    return (
      <div style={modalOverlayStyle} onClick={handleClose} aria-modal="true" role="dialog">
        <div style={modalBoxStyle} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 32,
              height: 32,
              border: "none",
              background: "#f6f8fa",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 18,
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
