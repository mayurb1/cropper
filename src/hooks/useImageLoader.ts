import { useEffect, useState } from "react";
import { loadImage } from "../utils/image";

export interface ImageSize {
  width: number;
  height: number;
}

export function useImageLoader(baseURL: string | null) {
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [imgSize, setImgSize] = useState<ImageSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!baseURL) {
      setLoadedImg(null);
      setImgSize({ width: 0, height: 0 });
      return;
    }
    let cancelled = false;
    loadImage(baseURL)
      .then((img) => {
        if (cancelled) return;
        setLoadedImg(img);
        setImgSize({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedImg(null);
          setImgSize({ width: 0, height: 0 });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [baseURL]);

  const isLoading = Boolean(baseURL && !loadedImg);

  return { loadedImg, imgSize, setImgSize, isLoading };
}
