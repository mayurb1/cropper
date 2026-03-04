> **Under maintenance** – We're fixing known issues. Use with caution. Updates will be published when ready.

# react-pixcraft

A lightweight React image editor with crop, rotate, flip, and scale. Uses **only React** and the native HTML5 Canvas API.

## Features

- **Crop** – Free-form or fixed aspect ratio (e.g. 16:9, 1:1)
- **Rotate** – 90° left, 90° right, 180°
- **Flip** – Horizontal and vertical
- **Scale** – Resize by width/height with aspect ratio lock
- **Undo / Redo**
- **Export** – Get edited image as Blob

## Installation

```bash
npm install react-pixcraft
```

## Peer Dependencies

- `react` >= 17.0.0
- `react-dom` >= 17.0.0

## Usage

```jsx
import { ImageEditor } from "react-pixcraft";

function App() {
  const handleExport = (blob, meta) => {
    console.log("Exported:", meta.width, "x", meta.height);
    // Use blob for upload, download, etc.
  };

  return (
    <ImageEditor
      src="https://example.com/image.jpg"
      onExport={handleExport}
      maxViewport={{ width: 1920, height: 1080 }}
      mime="image/png"
      className="my-editor"
    />
  );
}
```

## Props

| Prop                  | Type       | Default              | Description                                                    |
|-----------------------|------------|----------------------|----------------------------------------------------------------|
| `src`                 | `string`   | `null`               | Initial image URL (or null to upload first)                   |
| `onExport`            | `function` | —                    | `(blob, { width, height, mime }) => void`                     |
| `onClose`             | `function` | —                    | Called when the editor is closed (e.g. modal close)            |
| `maxViewport`         | `object`   | `{ width: 1920, height: 1080 }` | Max display size                                      |
| `mime`                | `string`   | `"image/png"`        | Output MIME type (e.g. `"image/jpeg"`)                        |
| `className`           | `string`   | —                    | Optional CSS class for the editor root                         |
| `modal`               | `boolean`  | `true`               | Render as a modal overlay; `false` for inline                 |
| `theme`               | `"light" \| "dark" \| "auto"` | `"light"` | Visual theme; `"auto"` uses `prefers-color-scheme`    |
| `labels`              | `object`   | —                    | Override button/label text (i18n). See types for keys.        |
| `classNameToolbar`    | `string`   | —                    | Optional class for the toolbar container                      |
| `classNameCanvasWrapper` | `string` | —                    | Optional class for the canvas wrapper                          |
| `classNameModal`      | `string`   | —                    | Optional class for the modal box                               |
| `classNameOverlay`    | `string`   | —                    | Optional class for the modal overlay                           |
| `styles`              | `object`   | —                    | Override styles: `root`, `card`, `toolbar`, `canvasWrapper`, `overlay`, `modal` |

### Theming with CSS variables

The editor root uses the class `react-pixcraft-editor` and sets these CSS variables so you can override them to match your site:

- `--rp-bg`, `--rp-surface`, `--rp-border`, `--rp-text`, `--rp-text-muted`
- `--rp-primary`, `--rp-primary-hover`, `--rp-input-bg`
- `--rp-overlay`, `--rp-shadow`, `--rp-checker`

Example: dark theme override

```css
.react-pixcraft-editor[data-theme="dark"] {
  --rp-bg: #0d1117;
  --rp-primary: #58a6ff;
  /* ... */
}
```

## License

MIT
