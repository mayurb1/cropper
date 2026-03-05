export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

export const CROP_HANDLE_SIZE = 10;

/** Core tab identifiers (always shown) */
export const CORE_TABS = ["crop", "resize", "scale"] as const;

/** Id used for the optional custom (fourth) tab when provided via ImageEditor customTab prop */
export const CUSTOM_TAB_ID = "custom" as const;

export type CoreTabId = (typeof CORE_TABS)[number];

export type TabId = CoreTabId | typeof CUSTOM_TAB_ID;
