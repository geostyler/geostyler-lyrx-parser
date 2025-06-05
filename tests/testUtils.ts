import fs from "fs";
import { LyrxParser } from "../src/index.ts";
import { CIMLayerDocument } from "../src/esri/types/CIMLayerDocument.ts";
import { ReadStyleResult } from "geostyler-style";

export async function loadGeostylerStyle(
  filePath: string,
): Promise<ReadStyleResult> {
  const lyrxParser = new LyrxParser();
  const lyrx: CIMLayerDocument = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let style = await lyrxParser.readStyle(lyrx);
  console.log(JSON.stringify(style, null, 2));
  return style;
}
