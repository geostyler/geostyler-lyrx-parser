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

describe("Parse unique value polygon renderer with marker symbols inside", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/polygon/polygon_marker_inside.lyrx",
    );
  });

  const expectedLegendValues = {
    10: {
      symbolizers: 3,
      graphicFill: 1,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI Default Marker#0x28",
            radius: 6.5,
            respectFrame: false,
          },
          graphicFillPadding: [4, 4, 4, 4],
        },
      ],
    },
    11: {
      symbolizers: 6,
      graphicFill: 2,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI IGL Font16#0x36",
            radius: 8,
            respectFrame: true,
          },
          graphicFillPadding: [1, 12, 1, 12],
        },
      ],
      graphicFill_2: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI IGL Font16#0x36",
            radius: 8,
            respectFrame: true,
          },
          graphicFillPadding: [7, 18, 7, 18],
        },
      ],
    },
    12: {
      symbolizers: 4,
      graphicFill: 1,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI Default Marker#0x2a",
            radius: 8,
            respectFrame: true,
          },
          graphicFillPadding: [5, 5, 5, 5],
        },
      ],
    },
    13: {
      symbolizers: 4,
      graphicFill: 1,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI Default Marker#0x21",
            radius: 3.5,
            respectFrame: true,
          },
          graphicFillPadding: [10, 10, 10, 10],
        },
      ],
    },
    14: {
      symbolizers: 4,
      graphicFill: 1,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI Default Marker#0x28",
            radius: 8,
            respectFrame: true,
          },
          graphicFillPadding: [22, 22, 22, 22],
        },
      ],
    },
    15: {
      symbolizers: 4,
      graphicFill: 1,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "shape://slash",
            radius: 5,
          },
        },
      ],
    },
    16: {
      symbolizers: 6,
      graphicFill: 2,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI Default Marker#0x21",
            radius: 3.5,
            respectFrame: true,
          },
          graphicFillPadding: [7, 7, 7, 7],
        },
      ],
      graphicFill_2: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI Default Marker#0x21",
            radius: 3.5,
            respectFrame: true,
          },
          graphicFillPadding: [6, 6, 6, 6],
        },
      ],
    },
    5: {
      symbolizers: 2,
      graphicFill: 0,
    },
    6: {
      symbolizers: 6,
      graphicFill: 2,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI SDS 2.00 1#0x3d",
            radius: 12,
            respectFrame: true,
          },
          graphicFillPadding: [5, 5, 5, 5],
        },
      ],
      graphicFill_2: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI SDS 2.00 1#0x3d",
            radius: 12,
            respectFrame: true,
          },
          graphicFillPadding: [5, 5, 5, 5],
        },
      ],
    },
    7: {
      symbolizers: 4,
      graphicFill: 1,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI IGL Font23#0x51",
            radius: 8,
            respectFrame: true,
          },
          graphicFillPadding: [0, 0, 0, 0],
        },
      ],
    },
    8: {
      symbolizers: 4,
      graphicFill: 1,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI Default Marker#0xce",
            radius: 8,
            respectFrame: true,
          },
          graphicFillPadding: [5, 5, 5, 5],
        },
      ],
    },
    9: {
      symbolizers: 4,
      graphicFill: 1,
      graphicFill_1: [
        {
          kind: "Fill",
          fillOpacity: 1,
          graphicFill: {
            kind: "Mark",
            wellKnownName: "ttf://ESRI Default Marker#0xce",
            radius: 5.5,
            respectFrame: true,
          },
          graphicFillPadding: [5, 5, 5, 5],
        },
      ],
    },
  };

  it("should have the expected rules with correct symbolizer graphicFill properties", () => {
    const rules = geostylerStyle.output?.rules ?? [];

    expect(rules.length).toBe(12);

    for (const rule of rules) {
      const expected = expectedLegendValues[rule.name];
      const fillSymbolizers = rule.symbolizers;
      expect(fillSymbolizers.length).toBe(expected.symbolizers);
      const graphicFills = rule.symbolizers
        .filter((s) => (s as FillSymbolizer).graphicFill !== undefined)
        .map((s) => (s as FillSymbolizer).graphicFill);

      expect(graphicFills.length).toBe(expected.graphicFill);

      graphicFills.forEach((graphicFill, i) => {
        const fillSymbolizerWithGraphicFill = rule.symbolizers.filter(
          (s) => (s as FillSymbolizer).graphicFill !== undefined,
        )[i] as FillSymbolizer;
        i += 1;
        expect(graphicFill?.kind).toEqual(
          expected[`graphicFill_${i}`][0].graphicFill.kind,
        );
        expect((graphicFill as any)?.wellKnownName).toEqual(
          expected[`graphicFill_${i}`][0].graphicFill.wellKnownName,
        );
        expect((graphicFill as any)?.radius).toEqual(
          expected[`graphicFill_${i}`][0].graphicFill.radius,
        );
        expect((graphicFill as any)?.respectFrame).toEqual(
          expected[`graphicFill_${i}`][0].graphicFill.respectFrame,
        );

        expect(fillSymbolizerWithGraphicFill.graphicFillPadding).toEqual(
          expected[`graphicFill_${i}`][0].graphicFillPadding,
        );
      });
    }
  });
});
