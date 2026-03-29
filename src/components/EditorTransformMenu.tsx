import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getBtnDisabledStyle } from "../styles";

/** Labels required to render the transform dropdown. */
export interface EditorTransformMenuLabels {
  imageRotationMenu: string;
  rotateLeft: string;
  rotateRight: string;
  rotate180: string;
  flipVertical: string;
  flipHorizontal: string;
}

export interface EditorTransformMenuProps {
  labels: EditorTransformMenuLabels;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onRotate180: () => void;
  onFlipVertical: () => void;
  onFlipHorizontal: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const MENU_STYLE: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  marginTop: 4,
  minWidth: 220,
  padding: 4,
  background: "var(--rp-surface)",
  border: "1px solid var(--rp-border)",
  borderRadius: 8,
  boxShadow: "var(--rp-shadow)",
  zIndex: 20,
};

const MENU_ITEM_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  border: "none",
  borderRadius: 6,
  background: "transparent",
  color: "var(--rp-text)",
  fontSize: 14,
  cursor: "pointer",
};

/**
 * Dropdown menu for rotate and flip actions. Commits transforms via parent callbacks.
 * @example
 * ```tsx
 * <EditorTransformMenu
 *   labels={labels}
 *   onRotateLeft={rotateLeft}
 *   disabled={!baseURL}
 * />
 * ```
 */
export function EditorTransformMenu({
  labels,
  onRotateLeft,
  onRotateRight,
  onRotate180,
  onFlipVertical,
  onFlipHorizontal,
  disabled = false,
  className,
  style,
}: EditorTransformMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const triggerId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      const t = e.target;
      if (el && t instanceof Node && !el.contains(t)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      close();
    },
    [close]
  );

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          ...getBtnDisabledStyle(disabled),
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>
          ↻
        </span>
        {labels.imageRotationMenu}
      </button>
      {open && !disabled && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          style={MENU_STYLE}
        >
          <button
            type="button"
            role="menuitem"
            style={MENU_ITEM_STYLE}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(onRotateLeft)}
          >
            {labels.rotateLeft}
          </button>
          <button
            type="button"
            role="menuitem"
            style={MENU_ITEM_STYLE}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(onRotateRight)}
          >
            {labels.rotateRight}
          </button>
          <button
            type="button"
            role="menuitem"
            style={MENU_ITEM_STYLE}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(onRotate180)}
          >
            {labels.rotate180}
          </button>
          <button
            type="button"
            role="menuitem"
            style={MENU_ITEM_STYLE}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(onFlipVertical)}
          >
            {labels.flipVertical}
          </button>
          <button
            type="button"
            role="menuitem"
            style={MENU_ITEM_STYLE}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(onFlipHorizontal)}
          >
            {labels.flipHorizontal}
          </button>
        </div>
      )}
    </div>
  );
}
