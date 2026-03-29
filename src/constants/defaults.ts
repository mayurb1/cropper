export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

export const CROP_HANDLE_SIZE = 10;

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
