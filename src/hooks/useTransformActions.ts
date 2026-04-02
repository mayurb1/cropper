import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { FilterConfig } from "../types";
import type { Viewport } from "../types";
import { DEFAULT_FILTER, WORKER_PIXEL_THRESHOLD } from "../constants";
import { loadImage, blobToDataUrl } from "../utils/image";
import { drawImageTransformed } from "../utils/canvas";
import { createImageResizeWorker } from "../utils/createImageResizeWorker";

export interface UseTransformActionsParams {
  loadedImg: HTMLImageElement | null;
  viewport: Viewport;
  filterStr: string;
  baseURL: string | null;
  imgSize: { width: number; height: number };
  /** MIME used when encoding committed bitmaps (prop, not export tab state). */
  mime: string;
  exportQuality: number;
  rotation: number;
  flip: { x: boolean; y: boolean };
  setRotation: Dispatch<SetStateAction<number>>;
  setFlip: Dispatch<SetStateAction<{ x: boolean; y: boolean }>>;
  pushHistory: (
    url: string,
    w: number,
    h: number,
    label?: string
  ) => void;
  setBaseURL: (url: string | null) => void;
  setImgSize: (size: { width: number; height: number }) => void;
  setFilter: Dispatch<SetStateAction<FilterConfig>>;
  setProcessing: (v: boolean) => void;
}

/**
 * Worker lifecycle, rotate/flip handlers with commit-to-bitmap, and large resize offload.
 * Rotation/flip state lives in the parent so `viewport` can be derived from rotation without cycles.
 */
export function useTransformActions({
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
}: UseTransformActionsParams) {
  const workerRef = useRef<Worker | null>(null);
  const pendingTransformCommitRef = useRef(false);

  useEffect(() => {
    workerRef.current = createImageResizeWorker();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    setRotation(0);
    setFlip({ x: false, y: false });
    pendingTransformCommitRef.current = false;
  }, [baseURL, setRotation, setFlip]);

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
          const octx = offscreen.getContext("2d");
          if (!octx) return;
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
      setRotation,
      setFlip,
      setFilter,
      setProcessing,
      resizeWithWorkerIfNeeded,
    ]
  );

  useEffect(() => {
    if (!pendingTransformCommitRef.current || !loadedImg) return;
    pendingTransformCommitRef.current = false;
    void commitCurrentViewToBitmap(undefined, undefined, "Rotate");
  }, [rotation, flip, loadedImg, commitCurrentViewToBitmap]);

  const rotateLeft = useCallback(() => {
    setRotation((d) => (d - 90 + 360) % 360);
    pendingTransformCommitRef.current = true;
  }, [setRotation]);

  const rotateRight = useCallback(() => {
    setRotation((d) => (d + 90) % 360);
    pendingTransformCommitRef.current = true;
  }, [setRotation]);

  const rotate180 = useCallback(() => {
    setRotation((d) => (d + 180) % 360);
    pendingTransformCommitRef.current = true;
  }, [setRotation]);

  const flipH = useCallback(() => {
    setFlip((f) => ({ ...f, x: !f.x }));
    pendingTransformCommitRef.current = true;
  }, [setFlip]);

  const flipV = useCallback(() => {
    setFlip((f) => ({ ...f, y: !f.y }));
    pendingTransformCommitRef.current = true;
  }, [setFlip]);

  return {
    commitCurrentViewToBitmap,
    rotateLeft,
    rotateRight,
    rotate180,
    flipH,
    flipV,
    resizeWithWorkerIfNeeded,
  };
}
