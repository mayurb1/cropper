/**
 * Draw an image on a 2D canvas with rotation (degrees), flip, and CSS filter string.
 */
export function drawImageTransformed(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number,
  rotationDeg: number,
  flipX: boolean,
  flipY: boolean,
  filterStr: string
): void {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  ctx.save();
  ctx.filter = filterStr;
  ctx.translate(canvasW / 2, canvasH / 2);
  ctx.rotate((rotationDeg * Math.PI) / 180);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.translate(-canvasW / 2, -canvasH / 2);
  ctx.drawImage(img, 0, 0, imgW, imgH, drawX, drawY, drawW, drawH);
  ctx.restore();
}
