import { describe, expect, it, beforeAll } from "vitest";
import { LineSymbolizer, ReadStyleResult } from "geostyler-style";
import { loadGeostylerStyle } from "./testUtils.ts";

describe("Parse simple polyline renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polyline/fc_polyline_simple.lyrx",
    );
  });

  it("should parse a valid style object", () => {
    expect(geostylerStyle).toBeDefined();
    expect(geostylerStyle.output).toBeDefined();
    expect(geostylerStyle.output?.name).toBe("fc_polyline_simple");
  });

  it("should have a single rule", () => {
    const rules = geostylerStyle.output?.rules;
    expect(rules).toHaveLength(1);
    expect(rules?.[0].name).toBe("Simple Polyline Legend");
  });

  it("should have a correct symbolizer", () => {
    const symbolizer = geostylerStyle.output?.rules?.[0]
      .symbolizers?.[0] as LineSymbolizer;
    expect(symbolizer).toBeDefined();
    expect(symbolizer?.kind).toBe("Line");
    expect(symbolizer?.color).toBe("#208280");
    expect(symbolizer?.opacity).toBe(1);
    expect(symbolizer?.width).toBeCloseTo(1.3333, 4);
    expect(symbolizer?.cap).toBe("round");
    expect(symbolizer?.join).toBe("round");
  });
});

describe("Parse unique value polyline renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polyline/fc_polyline_unique_values.lyrx",
    );
  });

  const expectedColors: Record<string, string> = {
    "0": "#bed9fe",
    "1": "#f1fdb4",
    "2": "#feb6b5",
    "3": "#f1b4fc",
    "4": "#bffde9",
    "5": "#fde7ce",
    "6": "#b9fdb7",
    "7": "#b6b3fd",
    "8": "#fed3ed",
    "9": "#e3fed1",
    "10": "#c9f4fe",
    "11": "#dbcefe",
  };

  it("should have the expected rules with correct colors", () => {
    const rules = geostylerStyle.output?.rules ?? [];
    const actualNames = rules.map((r) => r.name);

    expect(actualNames.sort()).toEqual(Object.keys(expectedColors).sort());

    for (const rule of rules) {
      expect(rule.name in expectedColors).toBe(true);
      expect(rule.filter).toEqual(["==", "trnr", rule.name]);

      const symbolizer = rule.symbolizers[0] as LineSymbolizer;

      expect(symbolizer.color).toBe(expectedColors[rule.name]);

      expect(symbolizer).toBeDefined();
      expect(symbolizer?.kind).toBe("Line");
      expect(symbolizer?.opacity).toBe(1);
      expect(symbolizer?.width).toBeCloseTo(1.3333, 4);
      expect(symbolizer?.cap).toBe("round");
      expect(symbolizer?.join).toBe("round");
    }
  });
});

describe("Parse graduated values polyline renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polyline/fc_polyline_graduated_colors.lyrx",
    );
  });

  const expectedColors: Record<string, string> = {
    "1 - 54": "#f4f400",
    "55 - 88": "#f4b700",
    "89 - 122": "#f47a00",
    "123 - 321": "#f43d00",
    "322 - 729": "#f40000",
  };

  it("should produce the expected rules with correct colors and structure", () => {
    const rules = geostylerStyle.output?.rules ?? [];
    const actualNames = rules.map((r) => r.name);
    expect(actualNames.sort()).toEqual(Object.keys(expectedColors).sort());

    for (const rule of rules) {
      expect(rule.name in expectedColors).toBe(true);
      const symbolizer = rule.symbolizers[0] as LineSymbolizer;

      expect(symbolizer.color).toBe(expectedColors[rule.name]);

      expect(symbolizer).toBeDefined();
      expect(symbolizer?.kind).toBe("Line");
      expect(symbolizer?.opacity).toBe(1);
      expect(symbolizer?.width).toBeCloseTo(1.3333, 4);
      expect(symbolizer?.cap).toBe("round");
      expect(symbolizer?.join).toBe("round");
    }
  });
});
