import type { FilterConfig } from "../types";

export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

export const CROP_HANDLE_SIZE = 10;

/** Default filter / adjustment values (1 = no change for brightness/contrast/saturation). */
export const DEFAULT_FILTER: FilterConfig = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  grayscale: 0,
  sepia: 0,
  blurPx: 0,
};

/** Use worker-assisted resize when output exceeds this many pixels. */
export const WORKER_PIXEL_THRESHOLD = 4_000_000;

/** Core tab identifiers (always shown) */
export const CORE_TABS = ["crop", "resize", "scale"] as const;

/** Id used for the optional custom tab when provided via ImageEditor customTab prop */
export const CUSTOM_TAB_ID = "custom" as const;

/** Built-in filters / adjustments tab */
export const FILTERS_TAB_ID = "filters" as const;

/** Export format and download tab */
export const EXPORT_TAB_ID = "export" as const;

export type CoreTabId = (typeof CORE_TABS)[number];

export type TabId =
  | CoreTabId
  | typeof CUSTOM_TAB_ID
  | typeof FILTERS_TAB_ID
  | typeof EXPORT_TAB_ID;
