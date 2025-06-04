import { describe, expect, it, beforeAll } from "vitest";
import { ReadStyleResult, TextSymbolizer } from "geostyler-style";
import { loadGeostylerStyle } from "./testUtils.ts";

describe("Parse lyrx with sql expression", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/labeling/layer_with_sql_expression.lyrx",
    );
  });

  it("should parse label class expression", () => {
    const rules = geostylerStyle.output!.rules;
    expect(rules.length).toEqual(2);
    expect(rules[1].filter).toEqual([">", "einzelnachtrag", "0"]);
  });
});

describe("Parse lyrx with vbscript label classes", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/labeling/layer_with_vbscript_label_classes.lyrx",
    );
  });

  it("should have parse label expression", () => {
    const rules = geostylerStyle.output!.rules;
    expect(rules.length).toEqual(2);
    const textSymbolizer = rules[1].symbolizers[0] as TextSymbolizer;
    expect(textSymbolizer.kind).toEqual("Text");
    expect(textSymbolizer.label).toEqual("{{bew_nr}} / {{bew_foerde}} l/s");
  });
});

describe("Parse layer with CIMSolidFill label symbol", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/labeling/label_with_CIMSolidFill_text_symbol.lyrx",
    );
  });

  it("should have parse label expression", () => {
    const rules = geostylerStyle.output!.rules;
    expect(rules.length).toEqual(2);
    const textSymbolizer = rules[1].symbolizers[0] as TextSymbolizer;
    expect(textSymbolizer.kind).toEqual("Text");
    expect(textSymbolizer.anchor).toEqual("right");
    expect(textSymbolizer.rotate).toEqual(0);
    expect(textSymbolizer.font).contain("Tahoma");
    expect(textSymbolizer.label).toEqual("$feature.name");
    expect(textSymbolizer.color).toEqual("#38a800");
    expect(textSymbolizer.fontWeight).toEqual("normal");
  });
});

describe("Parse layer with halo label symbol", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/labeling/label_with_halo_text_symbol.lyrx",
    );
  });

  it("should have parse label expression", () => {
    const rules = geostylerStyle.output!.rules;
    expect(rules.length).toEqual(2);
    const textSymbolizer = rules[1].symbolizers[0] as TextSymbolizer;
    expect(textSymbolizer.kind).toEqual("Text");
    expect(textSymbolizer.anchor).toEqual("right");
    expect(textSymbolizer.rotate).toEqual(0);
    expect(textSymbolizer.font).contain("Tahoma");
    expect(textSymbolizer.label).toEqual("$feature.name");
    expect(textSymbolizer.color).toEqual("#38a800");
    expect(textSymbolizer.fontWeight).toEqual("normal");
    expect(textSymbolizer.haloColor).toEqual("#ffffff");
  });
});
