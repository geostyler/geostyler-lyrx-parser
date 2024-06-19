import { expect, test, describe, beforeAll } from "vitest";
import fs from "fs";
import { LyrxParser } from "./LyrxParser";
import { ReadStyleResult, Rule } from "geostyler-style";

describe("LyrxParser should parse ae_netzbetreiber.lyrx", () => {
  var lyrx: any;
  var lyrxParser: LyrxParser;
  var geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    lyrxParser = new LyrxParser();
    lyrx = JSON.parse(
      fs.readFileSync("./data/lyrx/ae_netzbetreiber_02.lyrx", "utf8")
    );
    geostylerStyle = await lyrxParser.readStyle(lyrx);
  });

  test("should create the geostyler style", async () => {
    expect(geostylerStyle.output).toBeDefined();
  });

  test("should have correct number of rules", () => {
    expect((geostylerStyle.output?.rules[0] as any).rules.length).toEqual(118);
  });

  test("should set filter for rule AEW Energie AG", () => {
    const rule = (geostylerStyle.output?.rules[0] as any).rules.find(
      (x: Rule) => x.name === "AEW Energie AG"
    );
    expect(rule.filter).toBeDefined();

    // const expectedFilter = [
    //   "PropertyIsEqualTo",
    //   ["PropertyName", "ANBIETER"],
    //   "AEW Energie AG",
    // ]; // test succeeds with this filter
    const expectedFilter = '["==", "anbieter", "AEW Energie AG"]'; // test fails with this filter (output generated in sldParser)
    expect(rule.filter).toEqual(expectedFilter);
  });

  test("should set symbolizers for rule AEW Energie AG", () => {
    const rule = (geostylerStyle.output?.rules[0] as any).rules.find(
      (x: Rule) => x.name === "AEW Energie AG"
    );
    expect(rule.symbolizers).toBeDefined();
    expect(rule.symbolizers.length).toEqual(1);
    expect(rule.symbolizers[0].kind).toEqual("Fill");
    expect(rule.symbolizers[0].color).toEqual("#ffffbe");
    expect(rule.symbolizers[0].fillOpacity).toEqual(1);
  });
});

describe("LyrxParser should parse feature-layer-polygon-simple-renderer.lyrx", () => {
  var lyrx: any;
  var lyrxParser: LyrxParser;
  var geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    lyrxParser = new LyrxParser();
    lyrx = JSON.parse(
      fs.readFileSync(
        "./data/lyrx/feature-layer-polygon-simple-renderer.lyrx",
        "utf8"
      )
    );
    geostylerStyle = await lyrxParser.readStyle(lyrx);
  });

  test("should create the geostyler style", async () => {
    expect(geostylerStyle.output).toBeDefined();
  });

  test("should have correct number of rules", () => {
    expect((geostylerStyle.output?.rules[0] as any).rules.length).toEqual(1);
  });

  test("should set symbolizers", () => {
    const rule = (geostylerStyle.output?.rules[0] as any).rules.find(
      (x: Rule) => x.name === ""
    );
    expect(rule).toBeDefined();
    expect(rule.symbolizers).toHaveLength(2);
    const symbolizer1 = rule.symbolizers[0];
    expect(symbolizer1.kind).toEqual("Fill");
    expect(symbolizer1.color).toEqual("#d1cffc");
    expect(symbolizer1.fillOpacity).toEqual(1);
    const symbolizer2 = rule.symbolizers[1];
    expect(symbolizer2.kind).toEqual("Fill");
    expect(symbolizer2.outlineWidth).toEqual(0.9333333333333332);
    expect(symbolizer2.outlineOpacity).toEqual(1);
  });
});
