import { describe, expect, it, beforeAll } from "vitest";
import { LineSymbolizer, MarkSymbolizer, ReadStyleResult } from "geostyler-style";
import { loadGeostylerStyle } from "./testUtils.ts";
import { MarkerPlacementAngle } from "../src/constants.ts";

describe("Parse simple polyline renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polyline/polyline_simple.lyrx",
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
      "./tests/testdata/polyline/polyline_unique_values.lyrx",
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
      "./tests/testdata/polyline/polyline_graduated_colors.lyrx",
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

describe("Parse dashed and dotted polyline renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polyline/polyline_dashed_dotted.lyrx",
    );
  });

  it("should parse a valid style object", () => {
    expect(geostylerStyle).toBeDefined();
    expect(geostylerStyle.output).toBeDefined();
    expect(geostylerStyle.output?.name).toBe("fc_polyline_dashed_dotted");
  });

  it("should have two rules", () => {
    const rules = geostylerStyle.output?.rules;
    expect(rules).toHaveLength(2);
    expect(rules?.[0].name).toBe("Linienführung");
    expect(rules?.[1].name).toBe("Planungsgebiet");
    expect(rules?.[1].filter).toEqual(["==", "gemeinde", "Planungsgebiet"]);
  });

  it("should have a two correct symbolizers", () => {
    const symbolizer1 = geostylerStyle.output?.rules?.[0]
      .symbolizers?.[0] as LineSymbolizer;
    expect(symbolizer1).toBeDefined();
    expect(symbolizer1?.kind).toBe("Line");
    expect(symbolizer1?.color).toBe("#ab5f28");
    expect(symbolizer1?.opacity).toBe(1);
    expect(symbolizer1?.width).toBe(2);
    expect(symbolizer1?.cap).toBe("butt");
    expect(symbolizer1?.join).toBe("round");
    expect(symbolizer1?.dasharray).toEqual([
      11,
      3,
      3,
      3,
      11,
      3,
      3,
      3,
      11,
      0
    ]);

    const symbolizer2 = geostylerStyle.output?.rules?.[1]
      .symbolizers?.[0] as LineSymbolizer;
    expect(symbolizer2).toBeDefined();
    expect(symbolizer2?.kind).toBe("Line");
    expect(symbolizer2?.color).toBe("#ab5f28");
    expect(symbolizer2?.opacity).toBe(1);
    expect(symbolizer2?.width).toBeCloseTo(1.87, 2);
    expect(symbolizer2?.cap).toBe("butt");
    expect(symbolizer2?.join).toBe("round");
    expect(symbolizer2?.dasharray).toEqual([
      0,
      10,
      7,
      4
    ]);
    const symbolizer3 = geostylerStyle.output?.rules?.[1]
      .symbolizers?.[1] as LineSymbolizer;
    expect(symbolizer3).toBeDefined();
    expect(symbolizer3?.kind).toBe("Line");
    expect(symbolizer3?.graphicStroke).toBeDefined();
    expect(symbolizer3?.graphicStroke?.kind).toBe("Mark");
    expect((symbolizer3?.graphicStroke as MarkSymbolizer).wellKnownName).toBe("ttf://ESRI Default Marker#0x21");
    expect(symbolizer3?.dasharray).toEqual([
      8,
      13
    ]);
  });
});
