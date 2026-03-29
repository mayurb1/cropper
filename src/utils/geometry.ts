/**
 * Axis-aligned bounding box size for a rectangle of `width` × `height`
 * rotated by `rotationDeg` (degrees) around its center.
 */
export function axisAlignedBoundsForRotatedRect(
  width: number,
  height: number,
  rotationDeg: number
): { width: number; height: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  return {
    width: width * c + height * s,
    height: width * s + height * c,
  };
}
