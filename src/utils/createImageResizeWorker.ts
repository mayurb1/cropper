/**
 * Creates an inline Web Worker that resizes an ImageBitmap to target dimensions.
 * Falls back to null if Worker or URL API is unavailable.
 */
export function createImageResizeWorker(): Worker | null {
  if (typeof Worker === "undefined" || typeof URL === "undefined") {
    return null;
  }

  const source = `
    self.onmessage = function (e) {
      var data = e.data;
      if (!data || data.type !== 'resize') return;
      var bmp = data.bitmap;
      var outW = data.outW|0;
      var outH = data.outH|0;
      try {
        var canvas = new OffscreenCanvas(outW, outH);
        var ctx = canvas.getContext('2d');
        if (!ctx) {
          self.postMessage({ type: 'error', message: 'no context' });
          return;
        }
        ctx.drawImage(bmp, 0, 0, outW, outH);
        bmp.close();
        canvas.convertToBlob({ type: data.mime || 'image/png', quality: data.quality }).then(function (blob) {
          self.postMessage({ type: 'done', blob: blob });
        }).catch(function (err) {
          self.postMessage({ type: 'error', message: String(err) });
        });
      } catch (err) {
        self.postMessage({ type: 'error', message: String(err) });
      }
    };
  `;

  try {
    const blob = new Blob([source], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const revoke = () => URL.revokeObjectURL(url);
    worker.addEventListener("error", revoke);
    const origTerminate = worker.terminate.bind(worker);
    worker.terminate = () => {
      revoke();
      origTerminate();
    };
    return worker;
  } catch {
    return null;
  }
}

export interface ResizeWorkerMessage {
  type: "resize";
  bitmap: ImageBitmap;
  outW: number;
  outH: number;
  mime?: string;
  quality?: number;
}
