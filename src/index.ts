import {
  ReadStyleResult,
  Style,
  StyleParser,
  UnsupportedProperties,
  WriteStyleResult,
} from "geostyler-style";
import { convert } from "./toGeostyler.ts";
import { CIMLayerDocument } from "./esri/types/CIMLayerDocument.ts";
import { tryLoadNeededNodeEnvModules } from "./nodeEnvModules.ts";

export type ConstructorParams = {
  /**
   * Path to the directory where the base64 symbols (lyrx "url" property) must be written.
   */
  imagesOutputPath?: string;
};

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
  private options: ConstructorParams;

  constructor(options?: ConstructorParams) {
    this.options = options || {};
  }

  async readStyle(inputStyle: CIMLayerDocument): Promise<ReadStyleResult> {
    await tryLoadNeededNodeEnvModules(this.options.imagesOutputPath);
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
