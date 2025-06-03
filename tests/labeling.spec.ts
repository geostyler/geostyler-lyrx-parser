import { describe, expect, it, beforeAll } from "vitest";
import { ReadStyleResult, TextSymbolizer } from "geostyler-style";
import { loadGeostylerStyle } from "./testUtils.ts";

describe("Parse lyrx with sql expression", () => {
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    geostylerStyle = await loadGeostylerStyle(
      "./tests/testdata/labeling/fc_with_sql_expression.lyrx",
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
      "./tests/testdata/labeling/fc_with_vbscript_label_classes.lyrx",
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
