import {
  ReadStyleResult,
  Style,
  StyleParser,
  UnsupportedProperties,
  WriteStyleResult
} from 'geostyler-style';
import {convert} from "./toGeostyler";

/**
 * This parser can be used with the GeoStyler.
 * It implements the GeoStyler StyleParser interface to work with ArcGis lyrx
 * styles.
 *
 * @class LyrcParser
 * @implements StyleParser
 */
export class LyrxParser implements StyleParser<string> {

  static title = 'ArcGIS Pro lyrx parser';
  title = 'ArcGIS Pro lyrx parser';

  unsupportedProperties: UnsupportedProperties = {
  };

  readStyle(inputStyle: string): Promise<ReadStyleResult> {
    const geostyleStyle = convert(inputStyle)
    return Promise.resolve({
      output: {
        name: geostyleStyle[0].name,
        rules: geostyleStyle[0].rules
      },
      warnings: [],
      errors: []
    });
  }

  writeStyle(geoStylerStyle: Style): Promise<WriteStyleResult<any>> {
    console.log(geoStylerStyle);
    return Promise.resolve({
      output: {
        stylingRules: []
      },
      errors: [],
      warnings: []
    });
  }

}
