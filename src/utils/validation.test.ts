import { describe, expect, it } from "vitest";
import { validateDimension, DIMENSION_MIN, DIMENSION_MAX } from "./validation";

describe("validateDimension", () => {
  it("accepts in-range integers", () => {
    expect(validateDimension(100).valid).toBe(true);
  });

  it("rejects below min", () => {
    expect(validateDimension(DIMENSION_MIN - 1).valid).toBe(false);
  });

  it("rejects above max", () => {
    expect(validateDimension(DIMENSION_MAX + 1).valid).toBe(false);
  });
});
