import { expect, it, describe, beforeAll } from 'vitest';
import fs from 'fs';
import { LyrxParser } from './index.ts';
import {FillSymbolizer, MarkSymbolizer, ReadStyleResult, Rule, TextSymbolizer} from 'geostyler-style';
import {CIMLayerDocument} from './esri/types';

describe('LyrxParser should parse ae_netzbetreiber.lyrx', () => {
  let lyrx: CIMLayerDocument;
  let lyrxParser: LyrxParser;
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    lyrxParser = new LyrxParser();
    lyrx = JSON.parse(
      fs.readFileSync('./data/lyrx/ae_netzbetreiber_02.lyrx', 'utf8')
    );
    geostylerStyle = await lyrxParser.readStyle(lyrx);
  });

  it('should create the geostyler style', async () => {
    expect(geostylerStyle.output!).toBeDefined();
  });

  it('should have correct number of rules', () => {
    expect(geostylerStyle.output!.rules.length).toEqual(118);
  });

  it('should set simple filter for rule AEW Energie AG', () => {
    const rule = geostylerStyle.output!.rules.find(
      (x: Rule) => x.name === 'AEW Energie AG'
    );
    expect(rule?.filter).toBeDefined();
    const expectedFilter = ['==', 'anbieter', 'AEW Energie AG'];
    expect(rule?.filter).toEqual(expectedFilter);
  });

  it('should set symbolizers for rule AEW Energie AG', () => {
    const rule = geostylerStyle.output!.rules.find(
      (x: Rule) => x.name === 'AEW Energie AG'
    );
    expect(rule).toBeDefined();
    if (!rule) {return;}
    expect(rule.symbolizers).toBeDefined();
    expect(rule.symbolizers.length).toEqual(1);
    const symbolizer = rule.symbolizers[0] as FillSymbolizer;
    expect(symbolizer.kind).toEqual('Fill');
    expect(symbolizer.color).toEqual('#ffffbe');
    expect(symbolizer.fillOpacity).toEqual(1);
  });
});

describe('LyrxParser should parse feature-layer-polygon-simple-renderer.lyrx', () => {
  let lyrx: CIMLayerDocument;
  let lyrxParser: LyrxParser;
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    lyrxParser = new LyrxParser();
    lyrx = JSON.parse(
      fs.readFileSync(
        './data/lyrx/feature-layer-polygon-simple-renderer.lyrx',
        'utf8'
      )
    );
    geostylerStyle = await lyrxParser.readStyle(lyrx);
  });


  it('should set symbolizers', () => {
    const rule = geostylerStyle.output!.rules.find(
      (x: Rule) => x.name === ''
    );
    expect(rule).toBeDefined();
    if (!rule) {return;}
    expect(rule.symbolizers).toHaveLength(2);
    const symbolizer1 = rule.symbolizers[0] as FillSymbolizer;
    expect(symbolizer1.kind).toEqual('Fill');
    expect(symbolizer1.color).toEqual('#d1cffc');
    expect(symbolizer1.fillOpacity).toEqual(1);
    const symbolizer2 = rule.symbolizers[1] as FillSymbolizer;
    expect(symbolizer2.kind).toEqual('Fill');
    expect(symbolizer2.outlineWidth).toEqual(0.9333333333333332);
    expect(symbolizer2.outlineOpacity).toEqual(1);
  });
});

describe('LyrxParser should parse feature-layer-point-graduated-colors-renderer.lyrx', () => {
  let lyrx: CIMLayerDocument;
  let lyrxParser: LyrxParser;
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    lyrxParser = new LyrxParser();
    lyrx = JSON.parse(
      fs.readFileSync(
        './data/lyrx/feature-layer-point-graduated-colors-renderer.lyrx',
        'utf8'
      )
    );
    geostylerStyle = await lyrxParser.readStyle(lyrx);
  });

  it('should have correct number of rules', () => {
    expect(geostylerStyle.output!.rules.length).toEqual(5);
  });

  it('should set filters', () => {
    const rule = geostylerStyle.output!.rules.find(
      (x: Rule) => x.name === '6 - 35'
    );
    expect(rule).toBeDefined();
    if (!rule) {return;}
    expect(rule.filter).toBeDefined();
    const expectedFilter = ['<=', 'fragebogennr', 35];
    expect(rule.filter).toEqual(expectedFilter);
  });

  it('should set symbolizers', () => {
    const rule = geostylerStyle.output!.rules.find(
      (x: Rule) => x.name === '6 - 35'
    );
    expect(rule).toBeDefined();
    if (!rule) {return;}
    expect(rule.symbolizers).toHaveLength(1);
    const symbolizer = rule.symbolizers[0] as MarkSymbolizer;
    expect(symbolizer.kind).toEqual('Mark');
    expect(symbolizer.wellKnownName).toEqual('circle');
    expect(symbolizer.opacity).toEqual(1);
    expect(symbolizer.fillOpacity).toEqual(1);
    expect(symbolizer.color).toEqual('#f4f400');
    expect(symbolizer.rotate).toEqual(0);
    expect(symbolizer.radius).toEqual(2.6666666666666665);
    expect(symbolizer.strokeColor).toEqual('#000000');
    expect(symbolizer.strokeWidth).toEqual(0.9333333333333332);
    expect(symbolizer.strokeOpacity).toEqual(1);
  });
});

describe('LyrxParser should parse afu_gwn_02.lyrx', () => {
  let lyrx: CIMLayerDocument;
  let lyrxParser: LyrxParser;
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    lyrxParser = new LyrxParser();
    lyrx = JSON.parse(
      fs.readFileSync('./data/lyrx/afu_gwn_02.lyrx', 'utf8')
    );
    geostylerStyle = await lyrxParser.readStyle(lyrx);
  });

  it('should have parse label expression', () => {
    const rules = geostylerStyle.output!.rules;
    expect(rules.length).toEqual(6);
    const textSymbolizer = rules[5].symbolizers[0] as TextSymbolizer;
    expect(textSymbolizer.kind).toEqual('Text');
    expect(textSymbolizer.label).toEqual('{{bew_nr}} / {{bew_foerde}} l/s');
  });
});

describe('LyrxParser should parse kai_blattpk100_01.lyrx', () => {
  let lyrx: CIMLayerDocument;
  let lyrxParser: LyrxParser;
  let geostylerStyle: ReadStyleResult;

  beforeAll(async () => {
    lyrxParser = new LyrxParser();
    lyrx = JSON.parse(
      fs.readFileSync('./data/lyrx/kai_blattpk100_01.lyrx', 'utf8')
    );
    geostylerStyle = await lyrxParser.readStyle(lyrx);
  });

  it('should have parse whereClause expression', () => {
    const rules = geostylerStyle.output!.rules;
    expect(rules.length).toEqual(7);
    expect(rules[6].filter).toEqual(['>', 'stand', '0']);
  });
});
