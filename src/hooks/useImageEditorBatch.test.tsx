import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useImageEditorBatch } from "./useImageEditorBatch";

describe("useImageEditorBatch", () => {
  it("empty batch yields no previews and fileForUrl from file prop", () => {
    const file = new File([""], "a.png", { type: "image/png" });
    const { result } = renderHook(() =>
      useImageEditorBatch(undefined, file)
    );
    expect(result.current.batchPreviewEntries).toEqual([]);
    expect(result.current.fileForUrl).toBe(file);
  });

  it("creates preview URLs for batch items", async () => {
    const f = new File([""], "b.jpg", { type: "image/jpeg" });
    const { result } = renderHook(() =>
      useImageEditorBatch([{ file: f }], null)
    );
    await waitFor(() => {
      expect(result.current.batchPreviewEntries.length).toBe(1);
      expect(result.current.batchPreviewEntries[0].url).toMatch(/^blob:/);
    });
  });
});
