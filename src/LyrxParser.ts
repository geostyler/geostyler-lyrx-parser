import {
  ReadStyleResult,
  Style,
  StyleParser,
  UnsupportedProperties,
  WriteStyleResult
} from 'geostyler-style';

/**
 * This parser can be used with the GeoStyler.
 * It implements the GeoStyler StyleParser interface to work with ArcGis lyrx
 * styles.
 *
 * @class LyrcParser
 * @implements StyleParser
 */
export class LyrxParser implements StyleParser<any> {

  public static title = 'ArcGIS Pro lyrx parser';

  title = 'ArcGIS Pro lyrx parser';

  unsupportedProperties: UnsupportedProperties = {
  };

  readStyle(inputStyle: any): Promise<ReadStyleResult> {
    return Promise.resolve({
      output: {
        name: '',
        rules: []
      },
      warnings: [],
      errors: []
    });
  }

  writeStyle(geoStylerStyle: Style): Promise<WriteStyleResult<any>> {
    return Promise.resolve({
      output: {
        stylingRules: []
      },
      errors: [],
      warnings: []
    });
  }

}
