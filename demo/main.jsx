import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ImageEditor } from "../src/index.js";

const TEST_IMAGE = "https://picsum.photos/800/600";

function Demo() {
  const [showEditor, setShowEditor] = useState(false);

  const handleExport = (blob, meta) => {
    console.log("Exported:", meta?.width, "x", meta?.height, meta?.mime);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "edited.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ marginTop: 0 }}>react-pixcraft – Local Dev</h1>
      <p style={{ color: "#57606a", marginBottom: 24 }}>
        ImageEditor opens as a modal. Crop, rotate, flip, scale — then Export to download.
      </p>
      <button
        type="button"
        onClick={() => setShowEditor(true)}
        style={{
          padding: "10px 20px",
          fontSize: 16,
          cursor: "pointer",
          background: "#2f81f7",
          color: "white",
          border: "none",
          borderRadius: 8,
        }}
      >
        Open image editor
      </button>
      {showEditor && (
        <ImageEditor
          src={TEST_IMAGE}
          onExport={handleExport}
          onClose={() => setShowEditor(false)}
          maxViewport={{ width: 1920, height: 1080 }}
          mime="image/png"
          className="demo-editor"
        />
      )}
    </div>
  );
}

const root = document.getElementById("root");
createRoot(root).render(<Demo />);
