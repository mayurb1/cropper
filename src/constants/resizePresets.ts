export interface ResizePreset {
  label: string;
  width: number;
  height: number;
}

/** Common output size presets for the resize tab. */
export const RESIZE_PRESETS: ResizePreset[] = [
  { label: "Instagram", width: 1080, height: 1080 },
  { label: "Twitter", width: 1200, height: 675 },
  { label: "Facebook", width: 1200, height: 630 },
  { label: "HD", width: 1920, height: 1080 },
  { label: "4K", width: 3840, height: 2160 },
  { label: "Story 9:16", width: 1080, height: 1920 },
];
