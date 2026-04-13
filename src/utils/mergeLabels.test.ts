import { describe, expect, it } from "vitest";
import { mergeImageEditorLabels } from "./mergeLabels";

describe("mergeImageEditorLabels", () => {
  it("fills defaults and applies overrides", () => {
    const m = mergeImageEditorLabels({ title: "Custom" });
    expect(m.title).toBe("Custom");
    expect(m.close).toBe("Close");
  });

  it("returns full shape without assertion", () => {
    const m = mergeImageEditorLabels({});
    expect(m.crop).toBe("Crop");
  });
});
