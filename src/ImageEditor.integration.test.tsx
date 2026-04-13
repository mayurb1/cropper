import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ImageEditor } from "./ImageEditor";

describe("ImageEditor", () => {
  it("renders title from merged labels", () => {
    render(
      <ImageEditor
        modal={false}
        src={null}
        labels={{ title: "Test editor" }}
      />
    );
    expect(screen.getByRole("heading", { name: "Test editor" })).toBeTruthy();
  });
});
