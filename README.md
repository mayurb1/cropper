# react-pixcraft

A lightweight, zero-dependency React image editor with crop, rotate, flip, scale, filters, and multi-format export. Built entirely on **React** and the native **HTML5 Canvas API**.

Use it as a full-featured standalone modal, an inline editor component, or as **edit-before-upload middleware** in your image upload workflows.

---

## Features

- **Crop** – Free-form or aspect-ratio locked (1:1, 16:9, 4:3, etc.) with real-time coordinate readouts.
- **Rotate & Flip** – 90° clockwise/counter-clockwise, 180° rotation, horizontal & vertical flipping.
- **Scale & Resize** – Custom dimensions with aspect ratio lock, size presets, and scaling multiplier.
- **Filters & Adjustments** – Brightness, contrast, saturation, blur sliders, and one-click presets (Grayscale, Sepia).
- **Multi-Format Export** – Export to **PNG**, **JPEG**, **WebP**, or **AVIF** with output quality control and "Copy to Clipboard" support.
- **Undo / Redo** – Full history stack with snapshot management.
- **Batch Editing** – Edit queues of images with an interactive filmstrip and apply-to-all functionality.
- **Custom Sidebar Tabs** – Inject your own custom panels (watermarks, SEO metadata, tags) directly into the toolbar.
- **Keyboard Shortcuts** – Built-in hotkeys (Undo `Ctrl/Cmd+Z`, Redo `Ctrl+Y` / `Ctrl+Shift+Z`, Apply `Enter`, Cancel `Esc`, Shortcuts Help `?`).
- **Zero CSS Setup** – Styles are fully self-contained and injected automatically. No CSS imports required.
- **Theming** – Light, Dark, or Auto (`prefers-color-scheme`) mode with customizable CSS variables.
- **TypeScript Support** – First-class TypeScript types and declarations exported out of the box.

---

## Installation

```bash
npm install react-pixcraft
```

or with yarn / pnpm:

```bash
yarn add react-pixcraft
# or
pnpm add react-pixcraft
```

### Peer Dependencies

Ensure your project has React 18+ installed:
- `react` >= 18.0.0
- `react-dom` >= 18.0.0

---

## Quick Start

### 1. Component-First (Modal Editor)

Open the editor as a modal where users can upload or preview an existing image URL, edit, and export:

```tsx
import { useState } from "react";
import { ImageEditor } from "react-pixcraft";

export default function ProfileAvatarEditor() {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (blob: Blob, meta?: { width: number; height: number; mime: string }) => {
    // Example: Create a download link or upload the Blob to your server
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `edited-image.${meta?.mime.split("/")[1] || "png"}`;
    a.click();
    URL.revokeObjectURL(downloadUrl);

    setIsOpen(false);
  };

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Edit Image</button>

      {isOpen && (
        <ImageEditor
          src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800"
          onExport={handleExport}
          onClose={() => setIsOpen(false)}
          theme="dark"
        />
      )}
    </div>
  );
}
```

> **Note:** Both named (`import { ImageEditor } from "react-pixcraft"`) and default (`import ImageEditor from "react-pixcraft"`) imports are supported.

---

### 2. Edit-Before-Upload (Middleware Workflow)

Intercept a file input, allow the user to crop/adjust it, and upload the resulting edited `Blob` rather than the raw file:

```tsx
import { useState, ChangeEvent } from "react";
import { ImageEditor } from "react-pixcraft";

export default function FileUploadWithEditor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleExport = async (blob: Blob) => {
    // Upload edited blob to your backend
    const formData = new FormData();
    formData.append("file", blob, selectedFile?.name || "image.png");

    // await fetch("/api/upload", { method: "POST", body: formData });
    console.log("Exported Blob size:", blob.size);

    setSelectedFile(null);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileChange} />

      {selectedFile && (
        <ImageEditor
          file={selectedFile}
          onExport={handleExport}
          onClose={() => setSelectedFile(null)}
          mime="image/jpeg"
        />
      )}
    </div>
  );
}
```

---

### 3. Inline Editor (Non-Modal)

Render the editor directly inside your page layout by setting `modal={false}`:

```tsx
import { ImageEditor } from "react-pixcraft";

export default function InlineEditor() {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", height: 600 }}>
      <ImageEditor
        src="/sample.jpg"
        modal={false}
        previewFit="contain"
        onExport={(blob) => console.log("Exported:", blob)}
      />
    </div>
  );
}
```

---

### 4. Custom Sidebar Tab

Extend the sidebar with your own controls (such as metadata tags, watermarks, or AI enhancements) using `customTab`:

```tsx
import { ImageEditor } from "react-pixcraft";

export default function CustomTabEditor() {
  return (
    <ImageEditor
      src="/sample.jpg"
      customTab={{
        label: "Watermark",
        content: (
          <div style={{ padding: 16 }}>
            <h4>Add Watermark</h4>
            <input type="text" placeholder="Watermark text..." style={{ width: "100%", padding: 8 }} />
            <p style={{ fontSize: 12, color: "gray", marginTop: 8 }}>
              Configure custom options to apply on export.
            </p>
          </div>
        ),
      }}
      onExport={(blob) => console.log(blob)}
    />
  );
}
```

---

## Props Reference

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string \| null` | `null` | Initial image URL. Ignored if `file` is provided. |
| `file` | `File \| null` | `null` | Initial `File` object (e.g. from `<input type="file">`). Object URL lifecycle is managed automatically. |
| `onExport` | `(blob: Blob, meta?: ExportMeta) => void` | `undefined` | Callback invoked when the user saves/exports. Receives the `Blob` and metadata `{ width, height, mime, exportOptions }`. |
| `onClose` | `() => void` | `undefined` | Callback invoked when the editor is closed (via Close button, overlay click, or Esc key). |
| `modal` | `boolean` | `true` | When `true`, renders as a centered modal with backdrop overlay. Set to `false` for inline layout. |
| `theme` | `"light" \| "dark" \| "auto"` | `"light"` | Visual theme. `"auto"` uses the system's `prefers-color-scheme`. |
| `mime` | `string` | `"image/png"` | Default output MIME type (`"image/png"`, `"image/jpeg"`, `"image/webp"`, `"image/avif"`). |
| `maxViewport` | `{ width: number; height: number }` | `{ width: 1920, height: 1080 }` | Maximum display dimensions for preview scaling. |
| `previewFit` | `"contain" \| "natural"` | `"contain"` | `"contain"` scales preview to fit within view. `"natural"` displays 1:1 image pixels with scrollable area. |
| `canvasFrame` | `{ width: number; height: number }` | `undefined` | Fixed dimensions for the scrollable canvas area. |
| `showFiltersTab` | `boolean` | `true` | Whether to display the Filters & Adjustments sidebar tab. |
| `showExportTab` | `boolean` | `true` | Whether to display the Export tab (format, quality, download, clipboard). |
| `customTab` | `CustomTabConfig` | `undefined` | Adds a custom tab in the sidebar `{ label: string, content: ReactNode }`. |
| `batch` | `ImageEditorBatchItem[]` | `undefined` | Array of `{ file: File, label?: string }` for batch editing with filmstrip. |
| `shortcutsRequireFocus` | `boolean` | `false` (modal) / `true` (inline) | When `true`, keyboard shortcuts only trigger when focus is inside the editor root. |
| `labels` | `Partial<ImageEditorLabels>` | `undefined` | Internationalization (i18n) overrides for button and tool labels. |
| `styles` | `ImageEditorStyles` | `undefined` | Style overrides for internal containers (`root`, `card`, `toolbar`, `canvasWrapper`, `overlay`, `modal`, `canvasScrollArea`). |
| `className` | `string` | `undefined` | Custom CSS class applied to the root container. |
| `classNameModal` | `string` | `undefined` | Custom CSS class applied to the modal dialog card. |
| `classNameOverlay` | `string` | `undefined` | Custom CSS class applied to the modal overlay. |
| `classNameToolbar` | `string` | `undefined` | Custom CSS class applied to the toolbar/sidebar. |
| `classNameCanvasWrapper`| `string` | `undefined` | Custom CSS class applied to the canvas wrapper. |
| `classNameCanvasScrollArea`| `string` | `undefined` | Custom CSS class applied to the canvas scroll area. |

---

## Styling & Theming

### Zero CSS Configuration
`react-pixcraft` requires **no external stylesheet imports**. Styles, layout resets, and custom scrollbars are automatically injected into the document head when the component mounts.

### CSS Variables Customization
The editor root uses the class `.react-pixcraft-editor` and exposes CSS custom properties you can override to match your brand:

```css
/* Custom dark theme override example */
.react-pixcraft-editor[data-theme="dark"] {
  --rp-bg: #0f172a;
  --rp-surface: #1e293b;
  --rp-surface-muted: #334155;
  --rp-border: #475569;
  --rp-text: #f8fafc;
  --rp-text-muted: #94a3b8;
  --rp-primary: #3b82f6;
  --rp-primary-hover: #2563eb;
  --rp-input-bg: #0f172a;
  --rp-overlay: rgba(15, 23, 42, 0.75);
  --rp-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  --rp-checker: #1e293b;
  --rp-font-family: 'Inter', system-ui, sans-serif;
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Z</kbd> | Undo last change |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>Y</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo |
| <kbd>Enter</kbd> | Apply active crop / adjustments |
| <kbd>Esc</kbd> | Discard active action / Close editor |
| <kbd>?</kbd> | Open keyboard shortcuts reference |

---

## Next.js (App Router) & SSR

`react-pixcraft` interacts with the client-side Canvas and DOM APIs. When using Next.js App Router, ensure the component importing `ImageEditor` includes the `"use client"` directive at the top of the file:

```tsx
"use client";

import { ImageEditor } from "react-pixcraft";
// ...
```

---

## TypeScript Exports

All types are exported directly from `react-pixcraft`:

```ts
import type {
  ImageEditorProps,
  ImageEditorLabels,
  ImageEditorStyles,
  ImageEditorTheme,
  ImageEditorPreviewFit,
  ImageEditorBatchItem,
  CustomTabConfig,
  ExportOptions,
  ExportImageFormat,
  CropRect,
  FilterConfig,
  HistoryEntry,
  Viewport,
} from "react-pixcraft";
```

---

## License

[MIT](LICENSE) © [Mayur Bhalgama](https://github.com/mayurb1)

