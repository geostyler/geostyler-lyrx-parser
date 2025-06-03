import { describe, expect, it, beforeAll } from "vitest";
import { FillSymbolizer, ReadStyleResult } from "geostyler-style";
import { loadGeostylerStyle } from "./testUtils.ts";

describe("Parse simple polygon renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polygon/polygon_simple.lyrx",
    );
  });

  it("should parse a valid style object", () => {
    expect(geostylerStyle).toBeDefined();
    expect(geostylerStyle.output).toBeDefined();
    expect(geostylerStyle.output?.name).toBe("fc_polygon_simple");
  });

  it("should have a single rule", () => {
    const rules = geostylerStyle.output?.rules;
    expect(rules).toHaveLength(1);
    expect(rules?.[0].name).toBe("Simple Polygon Symbol");
  });

  it("should have correct number of symbolizers", () => {
    const rules = geostylerStyle.output?.rules;
    expect(rules?.[0].symbolizers).toHaveLength(2);
  });

  it("should have a correct symbolizer", () => {
    const symbolizer = geostylerStyle.output?.rules?.[0]
      .symbolizers?.[0] as FillSymbolizer;
    expect(symbolizer).toBeDefined();
    expect(symbolizer?.kind).toBe("Fill");
    expect(symbolizer?.color).toBe("#c0bdfc");
    expect(symbolizer?.fillOpacity).toBe(1);

    const outlineSymbolizer = geostylerStyle.output?.rules?.[0]
      .symbolizers?.[1] as FillSymbolizer;
    expect(outlineSymbolizer).toBeDefined();
    expect(outlineSymbolizer?.kind).toBe("Fill");
    expect(outlineSymbolizer?.outlineColor).toBe("#6e6e6e");
    expect(outlineSymbolizer?.outlineOpacity).toBe(1);
    expect(outlineSymbolizer?.outlineWidth).toBeCloseTo(0.9333, 4);
  });
});

describe("Parse unique value polygon renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polygon/polygon_unique_values.lyrx",
    );
  });
  const expectedLegendValues = {
    I: {
      filter: "ES_I",
      color: "#fcd1c8",
    },
    II: {
      filter: "ES_II",
      color: "#b3feb7",
    },
    III: {
      filter: "ES_III",
      color: "#beb4fe",
    },
    IV: {
      filter: "ES_IV",
      color: "#b5f5fe",
    },
    "keine ES festgelegt": {
      filter: "keine_ES",
      color: "#fcf4b2",
    },
  };

  it("should have the expected rules with correct symbolizer properties", () => {
    const rules = geostylerStyle.output?.rules ?? [];
    const actualNames = rules.map((r) => r.name);

    expect(actualNames.sort()).toEqual(
      Object.keys(expectedLegendValues).sort(),
    );

    for (const rule of rules) {
      expect(rule.name in expectedLegendValues).toBe(true);
      const expected = expectedLegendValues[rule.name];

      expect(rule.filter).toEqual(["==", "es", expected.filter]);

      const fillSymbolizer = rule.symbolizers.find(
        (s) => (s as FillSymbolizer).color !== undefined,
      ) as FillSymbolizer;

      const outlineSymbolizer = rule.symbolizers.find(
        (s) => (s as FillSymbolizer).outlineColor !== undefined,
      ) as FillSymbolizer;

      expect(fillSymbolizer).toBeDefined();
      expect(fillSymbolizer.kind).toBe("Fill");
      expect(fillSymbolizer.color).toBe(expected.color);
      expect(fillSymbolizer.fillOpacity).toBe(1);

      expect(outlineSymbolizer).toBeDefined();
      expect(outlineSymbolizer.kind).toBe("Fill");
      expect(outlineSymbolizer.outlineColor).toBe("#6e6e6e");
      expect(outlineSymbolizer.outlineOpacity).toBe(1);
      expect(outlineSymbolizer.outlineWidth).toBeCloseTo(0.9333, 4);
    }
  });
});

describe("Parse graduated values polygon renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polygon/polygon_graduated_colors.lyrx",
    );
  });

  const expectedLegendValues: Record<string, { color: string }> = {
    "0 - 27": { color: "#f4f400" },
    "28 - 72": { color: "#f4b700" },
    "73 - 120": { color: "#f47a00" },
    "121 - 173": { color: "#f43d00" },
    "174 - 236": { color: "#f40000" },
  };

  it("should produce the expected rules with correct colors and structure", () => {
    const rules = geostylerStyle.output?.rules ?? [];
    const actualNames = rules.map((r) => r.name);
    expect(actualNames.sort()).toEqual(
      Object.keys(expectedLegendValues).sort(),
    );

    for (const rule of rules) {
      expect(rule.name in expectedLegendValues).toBe(true);

      const expected = expectedLegendValues[rule.name];

      const fillSymbolizer = rule.symbolizers.find(
        (s) => (s as FillSymbolizer).color !== undefined,
      ) as FillSymbolizer;

      const outlineSymbolizer = rule.symbolizers.find(
        (s) => (s as FillSymbolizer).outlineColor !== undefined,
      ) as FillSymbolizer;

      expect(fillSymbolizer).toBeDefined();
      expect(fillSymbolizer.kind).toBe("Fill");
      expect(fillSymbolizer.color).toBe(expected.color);
      expect(fillSymbolizer.fillOpacity).toBe(1);

      expect(outlineSymbolizer).toBeDefined();
      expect(outlineSymbolizer.kind).toBe("Fill");
      expect(outlineSymbolizer.outlineColor).toBe("#6e6e6e");
      expect(outlineSymbolizer.outlineOpacity).toBe(1);
      expect(outlineSymbolizer.outlineWidth).toBeCloseTo(0.93333, 4);
    }
  });
});
