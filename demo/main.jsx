import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ImageEditor } from "../src/index.ts";

const sectionStyle = {
  marginBottom: 32,
  padding: 20,
  border: "1px solid #d0d7de",
  borderRadius: 12,
  background: "#f6f8fa",
};

const titleStyle = {
  margin: "0 0 8px 0",
  fontSize: 18,
  fontWeight: 600,
  color: "#24292f",
};

const descStyle = {
  margin: "0 0 16px 0",
  fontSize: 14,
  color: "#57606a",
  lineHeight: 1.5,
};

const buttonStyle = {
  padding: "10px 20px",
  fontSize: 14,
  cursor: "pointer",
  background: "#218bff",
  color: "white",
  border: "none",
  borderRadius: 8,
};

const inputStyle = {
  marginRight: 12,
  fontSize: 14,
};

function useExportAsDownload() {
  return (blob, meta) => {
    console.log("Exported:", meta?.width, "x", meta?.height, meta?.mime);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `edited.${meta?.mime === "image/jpeg" ? "jpg" : "png"}`;
    a.click();
    URL.revokeObjectURL(url);
  };
}

/** Pattern 1: Component-first – user opens editor, uploads inside, edits, then saves. */
function ComponentFirstExample() {
  const [showEditor, setShowEditor] = useState(false);
  const handleExport = useExportAsDownload();

  return (
    <div style={sectionStyle}>
      <h2 style={titleStyle}>1. Component-first</h2>
      <p style={descStyle}>
        User opens the editor, uploads or picks an image inside it, edits, then saves. You get the result in{" "}
        <code>onExport</code>.
      </p>
      <button type="button" style={buttonStyle} onClick={() => setShowEditor(true)}>
        Edit profile picture
      </button>
      {showEditor && (
        <ImageEditor
          src={null}
          onExport={(blob, meta) => {
            handleExport(blob, meta);
            setShowEditor(false);
          }}
          onClose={() => setShowEditor(false)}
          maxViewport={{ width: 1920, height: 1080 }}
          mime="image/png"
        />
      )}
    </div>
  );
}

/** Pattern 2: Edit-before-upload (middleware) – user selects file → editor opens with that file → user edits → you get blob to upload. */
function EditBeforeUploadExample() {
  const [selectedFile, setSelectedFile] = useState(null);
  const handleExport = useExportAsDownload();

  return (
    <div style={sectionStyle}>
      <h2 style={titleStyle}>2. Edit-before-upload (middleware)</h2>
      <p style={descStyle}>
        User selects a file in your UI → editor opens with that file → user edits → on Save you get a Blob and upload
        it. Pass the <code>File</code> via the <code>file</code> prop.
      </p>
      <input
        type="file"
        accept="image/*"
        style={inputStyle}
        onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
      />
      {selectedFile && (
        <ImageEditor
          file={selectedFile}
          onExport={(blob, meta) => {
            handleExport(blob, meta);
            setSelectedFile(null);
          }}
          onClose={() => setSelectedFile(null)}
          mime="image/jpeg"
        />
      )}
    </div>
  );
}

function Demo() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", maxWidth: 720 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>react-pixcraft – Demo</h1>
      <p style={{ color: "#57606a", marginBottom: 24 }}>
        Two ways to use the editor: open it and upload inside, or intercept file selection and edit before upload.
      </p>
      <ComponentFirstExample />
      <EditBeforeUploadExample />
    </div>
  );
}

const root = document.getElementById("root");
createRoot(root).render(<Demo />);
