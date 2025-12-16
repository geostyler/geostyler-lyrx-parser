import {
  ReadStyleResult,
  Style,
  StyleParser,
  UnsupportedProperties,
  WriteStyleResult,
} from "geostyler-style";
import { convert } from "./toGeostyler.ts";
import { CIMLayerDocument } from "./esri/types/CIMLayerDocument.ts";

export type ConstructorParams = {};

/**
 * This parser can be used with the GeoStyler.
 * It implements the GeoStyler StyleParser interface to work with ArcGis lyrx
 * styles.
 *
 * @class LyrcParser
 * @implements StyleParser
 */
export class LyrxParser implements StyleParser<CIMLayerDocument> {
  static title = "ArcGIS Pro lyrx parser";
  title = "ArcGIS Pro lyrx parser";
  unsupportedProperties: UnsupportedProperties = {};

  // @ts-ignore currently empty, but allow a common signature regarding the other parsers.
  private options: ConstructorParams;

  constructor(options?: ConstructorParams) {
    this.options = options || {};
  }

  readStyle(inputStyle: CIMLayerDocument): Promise<ReadStyleResult> {
    const geostylerStyle = convert(inputStyle);
    return Promise.resolve({
      output: {
        name: geostylerStyle[0].name,
        rules: geostylerStyle[0].rules,
      },
      warnings: [],
      errors: [],
    });
  }

  writeStyle(geoStylerStyle: Style): Promise<WriteStyleResult<any>> {
    // eslint-disable-next-line no-console
    console.log(geoStylerStyle);
    return Promise.resolve({
      output: {
        stylingRules: [],
      },
      errors: [],
      warnings: [],
    });
  }
}

export default LyrxParser;
