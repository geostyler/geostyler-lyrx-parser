import { describe, expect, it, beforeAll } from "vitest";
import {
  IconSymbolizer,
  MarkSymbolizer,
  ReadStyleResult,
} from "geostyler-style";
import { loadGeostylerStyle } from "./testUtils.ts";

describe("Parse simple point renderer", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/point/point_simple.lyrx",
    );
  });

  it("should parse a valid style object", () => {
    expect(geostylerStyle).toBeDefined();
    expect(geostylerStyle.output).toBeDefined();
    expect(geostylerStyle.output?.name).toBe("fc_point_simple");
  });

  it("should have a single rule", () => {
    const rules = geostylerStyle.output?.rules;
    expect(rules).toHaveLength(1);
    expect(rules?.[0].name).toBe("Single Symbol Legend");
  });

  it("should have a correct symbolizer", () => {
    const symbolizer = geostylerStyle.output?.rules?.[0]
      .symbolizers?.[0] as MarkSymbolizer;
    expect(symbolizer).toBeDefined();
    expect(symbolizer?.kind).toBe("Mark");
    expect(symbolizer?.wellKnownName).toBe("circle");
    expect(symbolizer?.color).toBe("#708e3b");
    expect(symbolizer?.strokeColor).toBe("#000000");
    expect(symbolizer?.strokeWidth).toBeCloseTo(0.9333, 4);
    expect(symbolizer?.radius).toBeCloseTo(2.6666, 3);
    expect(symbolizer?.opacity).toBe(1);
    expect(symbolizer?.fillOpacity).toBe(1);
    expect(symbolizer?.strokeOpacity).toBe(1);
  });
});

describe("Parse unique value point renderer", () => {
  let geostylerStyle: ReadStyleResult;

  const expectedColors: Record<string, string> = {
    "Bergwerk in Betrieb": "#fdcbb6",
    Doline: "#cfb2fe",
    "Erratischer Block: Kristalline Gesteine im allgemeinen": "#b2feb5",
    "Erratischer Block: Sedimente im allgemeinen": "#b8effc",
    "Gefasste Quelle": "#fefcb6",
    "Grundwasserfassung (evtl. mit Tiefenangabe)": "#fcbddd",
    "Pumpwerk (mit Fluss, bzw. See-Wasserfassung)": "#d1d3fc",
    "Quelle (im allgemeinen)": "#b6fedd",
    Reservoir: "#fcf1d2",
    "Steinbruch, Kiesgrube aufgelassen": "#fcbefd",
    "Steinbruch, Kiesgrube in Ausbeutung": "#e0fcd2",
    "Tasche, Kluftfüllungen von Bohnerz- und Hupperbildungen": "#cffcf2",
  };

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/point/point_unique_values.lyrx",
    );
  });

  it("should have the expected rules with correct colors", () => {
    const rules = geostylerStyle.output?.rules ?? [];
    const actualNames = rules.map((r) => r.name);

    expect(actualNames.sort()).toEqual(Object.keys(expectedColors).sort());

    for (const rule of rules) {
      expect(rule.name in expectedColors).toBe(true);
      expect(rule.filter).toEqual(["==", "name", rule.name]);

      const symbolizer = rule.symbolizers[0] as MarkSymbolizer;

      expect(symbolizer.color).toBe(expectedColors[rule.name]);

      expect(symbolizer.kind).toBe("Mark");
      expect(symbolizer.wellKnownName).toBe("circle");
      expect(symbolizer.radius).toBeCloseTo(2.6666, 3);
      expect(symbolizer.strokeColor).toBe("#000000");
      expect(symbolizer.strokeWidth).toBeCloseTo(0.9333, 4);
      expect(symbolizer.strokeOpacity).toBe(1);
      expect(symbolizer.fillOpacity).toBe(1);
    }
  });
});

describe("Parse graduated values point renderer", () => {
  let geostylerStyle: ReadStyleResult;

  const expectedColors: Record<string, string> = {
    "1 - 2": "#f4f400",
    "3 - 18": "#f4b700",
    "19 - 35": "#f47a00",
    "36 - 62": "#f43d00",
    "63 - 164": "#f40000",
  };

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/point/point_graduated_colors.lyrx",
    );
  });

  it("should produce the expected rules with correct colors and structure", () => {
    const rules = geostylerStyle.output?.rules ?? [];
    const actualNames = rules.map((r) => r.name);
    expect(actualNames.sort()).toEqual(Object.keys(expectedColors).sort());

    for (const rule of rules) {
      expect(rule.name in expectedColors).toBe(true);
      const symbolizer = rule.symbolizers[0] as MarkSymbolizer;

      expect(symbolizer.color).toBe(expectedColors[rule.name]);

      expect(symbolizer.kind).toBe("Mark");
      expect(symbolizer.wellKnownName).toBe("circle");
      expect(symbolizer.radius).toBeCloseTo(2.6666, 3);
      expect(symbolizer.strokeColor).toBe("#000000");
      expect(symbolizer.strokeWidth).toBeCloseTo(0.9333, 4);
      expect(symbolizer.strokeOpacity).toBe(1);
      expect(symbolizer.fillOpacity).toBe(1);
      expect(rule.filter).toBeDefined();
    }
  });
});

describe("Parse point renderer with unique value character marker symbols", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/point/point_unique_values_CIMCharacterMarkers.lyrx",
    );
  });

  const expectedLegendValues: Record<
    string,
    { symbols: { wellKnownName: string; color: string }[] }
  > = {
    "Ohne Sanierung": {
      symbols: [
        {
          wellKnownName: "ttf://ESRI Geometric Symbols#0x25",
          color: "#00ff00",
        },
        {
          wellKnownName: "ttf://ESRI Geometric Symbols#0x55",
          color: "#000000",
        },
      ],
    },
    "Teilweise saniert": {
      symbols: [
        {
          wellKnownName: "ttf://ESRI Geometric Symbols#0x25",
          color: "#00ff00",
        },
        {
          wellKnownName: "ttf://ESRI Geometric Symbols#0x5b",
          color: "#000000",
        },
      ],
    },
    "Sanierung abgeschlossen": {
      symbols: [
        {
          wellKnownName: "ttf://ESRI Geometric Symbols#0x25",
          color: "#00ff00",
        },
        {
          wellKnownName: "ttf://ESRI Geometric Symbols#0x61",
          color: "#000000",
        },
      ],
    },
    "Ohne Information": {
      symbols: [
        {
          wellKnownName: "ttf://ESRI Geometric Symbols#0x25",
          color: "#ff0000",
        },
        {
          wellKnownName: "ttf://ESRI Geometric Symbols#0x55",
          color: "#000000",
        },
      ],
    },
  };

  it("should produce the expected rules with correct symbolizers and structure", () => {
    const rules = geostylerStyle.output?.rules ?? [];
    const actualNames = rules.map((r) => r.name);
    expect(actualNames.sort()).toEqual(
      Object.keys(expectedLegendValues).sort(),
    );

    for (const rule of rules) {
      expect(rule.name in expectedLegendValues).toBe(true);

      const expectedSymbols = expectedLegendValues[rule.name].symbols;
      const actualSymbols = rule.symbolizers as MarkSymbolizer[];

      expect(actualSymbols.length).toBe(expectedSymbols.length);

      for (let i = 0; i < expectedSymbols.length; i++) {
        const actual = actualSymbols[i];
        const expected = expectedSymbols[i];

        expect(actual.kind).toBe("Mark");
        expect(actual.wellKnownName).toBe(expected.wellKnownName);
        expect(actual.color).toBe(expected.color.toLowerCase());

        expect(actual.strokeColor).toBe("#000000");
        expect(actual.strokeWidth).toBeCloseTo(0);
        expect(actual.strokeOpacity).toBeCloseTo(0);
        expect(actual.fillOpacity).toBeCloseTo(1);
        expect(actual.radius).toBeCloseTo(10.6666, 3);
      }

      expect(rule.filter).toBeDefined();
    }
  });
});

describe("Parse point with CIMPictureMarker", () => {
  const lyrxFile = "./tests/testdata/point/point_picture_marker.lyrx";

  it("should use layer.url as image content", async () => {
    const geostylerStyle = await loadGeostylerStyle(lyrxFile);
    // Test if it is an IconSymbolizer.
    const rules = geostylerStyle.output?.rules;
    expect(rules).toHaveLength(1);
    const symbolizer = rules?.[0].symbolizers?.[0] as IconSymbolizer;
    expect(symbolizer.kind).toEqual("Icon");
    expect(symbolizer.size).toEqual(21.333333333333332);
    // Test the image name.
    const fileName = symbolizer.image as string;
    expect(fileName).toBeDefined();
    expect(fileName.startsWith("data:image/png;base64,iVB"));
    expect(fileName.endsWith("CYII="));
    expect(geostylerStyle.warnings).toEqual([]);
  });
});

describe("Parse point with Bezier curve marker", () => {
  const lyrxFile = "./tests/testdata/point/point_curveRings_marker.lyrx";

  it("should parse bezier curve marker to wellKnownName wkt://polygon", async () => {
    const geostylerStyle = await loadGeostylerStyle(lyrxFile);
    // Test if it is a MarkSymbolizer.
    const rules = geostylerStyle.output?.rules;
    expect(rules).toHaveLength(5);
    const symbolizer = rules?.[0].symbolizers?.[0] as MarkSymbolizer;
    expect(symbolizer.kind).toEqual("Mark");
    expect(symbolizer.wellKnownName?.startsWith("wkt://POLYGON")).toBe(true);
    expect(symbolizer.color).toBe("#c93100");
    expect(symbolizer.radius).toBeCloseTo(6.1666, 3);
    expect(geostylerStyle.warnings).toEqual([]);
  });
});
