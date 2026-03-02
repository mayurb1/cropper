# react-pixcraft

A lightweight React image editor with crop, rotate, flip, and scale. Uses **only React** and the native HTML5 Canvas API—no Konva, use-image, or other image libraries.

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

| Prop         | Type       | Default              | Description                                  |
|--------------|------------|----------------------|----------------------------------------------|
| `src`        | `string`   | `null`               | Initial image URL (or null to upload first)  |
| `onExport`   | `function` | —                    | `(blob, { width, height, mime }) => void`   |
| `maxViewport`| `object`   | `{ width: 1920, height: 1080 }` | Max display size                    |
| `mime`       | `string`   | `"image/png"`        | Output MIME type (e.g. `"image/jpeg"`)      |
| `className`  | `string`   | —                    | Optional CSS class for the container         |

## License

MIT
