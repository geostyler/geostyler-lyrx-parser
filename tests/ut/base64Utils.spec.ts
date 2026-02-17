import { expect, it, describe } from "vitest";
import { scaleToSize } from "../../src/base64Utils";

describe("base64Utils", () => {
  it("scaleToSize", () => {
    expect(scaleToSize(40, 40, 40)).toEqual([40, 40]);
    // Smaller new size
    expect(scaleToSize(20, 80, 40)).toEqual([20, 10]);
    expect(scaleToSize(20, 40, 80)).toEqual([10, 20]);
    // bigger new size
    expect(scaleToSize(160, 80, 40)).toEqual([160, 80]);
    expect(scaleToSize(160, 40, 80)).toEqual([80, 160]);
  });
});
