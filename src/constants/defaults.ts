export const DEFAULT_VIEWPORT = { width: 1920, height: 1080 };

export const CROP_HANDLE_SIZE = 10;

/** Tab identifiers for the header */
export const TABS = ["crop", "resize", "scale", "seo"] as const;

export type TabId = (typeof TABS)[number];
