import { Fill, Layer, Marker, Stroke } from "./badTypes.ts";
import { toWKT } from "./wktGeometries.ts";
import { ESRI_SYMBOLS_FONT, OFFSET_FACTOR, ptToPx } from "./constants";
import { processColor, processOpacity } from "./processUtils.ts";
import {
  esriFontToStandardSymbols,
  extractFillColor,
  extractFillOpacity,
  extractStroke,
  ptToPxProp,
  WARNINGS,
} from "./toGeostylerUtils.ts";
import { processSymbolReference } from "./processSymbolReference.ts";
// import { writeFileSync, existsSync, mkdirSync } from 'fs';
// import uuid from 'uuid';
// import { tmpdir } from 'os';
// import path from 'path';

export const processSymbolLayer = (
  layer: any,
  symboltype: any,
  options?: any
) => {
  let layerType: string = layer["type"];
  switch (layerType) {
    case "CIMSolidStroke":
      return processSymbolSolidStroke(layer, symboltype);
    case "CIMSolidFill":
      return processSymbolSolidFill(layer);
    case "CIMCharacterMarker":
      return processSymbolCharacterMarker(layer, options);
    case "CIMVectorMarker":
      return processSymbolVectorMarker(layer);
    case "CIMHatchFill":
      return processSymbolHatchFill(layer);
    case "CIMPictureFill":
    case "CIMPictureMarker":
      return processSymbolPicture(layer);
    default:
      return;
  }
};

const processSymbolSolidStroke = (layer: any, symboltype: any) => {
  let effects = extractEffect(layer);
  if (symboltype === "CIMPolygonSymbol") {
    let stroke: Stroke = {
      kind: "Fill",
      outlineColor: processColor(layer["color"]),
      outlineOpacity: processOpacity(layer["color"]),
      outlineWidth: ptToPxProp(layer, "width", 0),
    };
    if ("dasharray" in effects) {
      stroke["outlineDasharray"] = effects["dasharray"];
    }
    return stroke;
  } else {
    let stroke: Stroke = {
      kind: "Line",
      color: processColor(layer["color"]),
      opacity: processOpacity(layer["color"]),
      width: ptToPxProp(layer, "width", 0),
      perpendicularOffset: 0,
      cap: layer["capStyle"].toLowerCase(),
      join: layer["joinStyle"].toLowerCase(),
    };
    if ("dasharray" in effects) {
      stroke["dasharray"] = effects["dasharray"];
    }
    if ("offset" in effects) {
      stroke["perpendicularOffset"] = effects["offset"];
    }
    return stroke;
  }
};

const processSymbolSolidFill = (layer: any): any => {
  let color = layer.color;
  if (color !== undefined) {
    return {
      kind: "Fill",
      opacity: processOpacity(color),
      color: processColor(color),
      fillOpacity: 1.0,
    };
  }
};

const processSymbolCharacterMarker = (
  layer: any,
  options: { [key: string]: any }
): { [key: string]: any } => {
  let replaceesri =
    options.replaceesri === undefined ? false : options.replaceesri;
  let fontFamily = layer.fontFamilyName;
  let charindex = layer.characterIndex;
  let hexcode = charindex.toString(16);
  let size = ptToPxProp(layer, "size", 12);

  let name: string;
  if (fontFamily === ESRI_SYMBOLS_FONT && replaceesri) {
    name = esriFontToStandardSymbols(charindex);
  } else {
    name = `ttf://${fontFamily}#${hexcode}`;
  }

  let rotate = layer.rotation === undefined ? 0 : layer.rotation;
  let rotateClockwise =
    layer.rotateClockwise === undefined ? false : layer.rotateClockwise;
  if (!rotateClockwise) {
    rotate *= -1;
  }

  let fillColor: string;
  let fillOpacity: number;
  let strokeColor: string;
  let strokeWidth: number;
  let strokeOpacity: number;
  try {
    let symbolLayers = layer.symbol.symbolLayers;
    fillColor = extractFillColor(symbolLayers);
    fillOpacity = extractFillOpacity(symbolLayers);
    [strokeColor, strokeWidth, strokeOpacity] = extractStroke(symbolLayers);
  } catch (e) {
    fillColor = "#000000";
    fillOpacity = 1.0;
    strokeOpacity = 0;
    strokeColor = "#000000";
    strokeWidth = 0.0;
  }

  return {
    opacity: 1.0,
    offset: extractOffset(layer),
    fillOpacity: fillOpacity,
    strokeColor: strokeColor,
    strokeOpacity: strokeOpacity,
    strokeWidth: strokeWidth,
    rotate: rotate,
    kind: "Mark",
    color: fillColor,
    wellKnownName: name,
    size: size,
    Z: 0,
  };
};

const processSymbolVectorMarker = (layer: Layer): Marker => {
  if (layer.size) {
    layer.size = ptToPxProp(layer, "size", 3);
  }
  // Default values
  let fillColor = "#ff0000";
  let strokeColor = "#000000";
  let strokeWidth = 1.0;
  let markerSize = 10;
  let strokeOpacity = 1;
  let wellKnownName = "circle";
  let maxX: number | null = null;
  let maxY: number | null = null;

  let markerGraphics =
    layer.markerGraphics !== undefined ? layer.markerGraphics : [];
  if (markerGraphics.length > 0) {
    // TODO: support multiple marker graphics
    let markerGraphic = markerGraphics[0];
    let marker = processSymbolReference(markerGraphic, {})[0];
    let sublayers = markerGraphic.symbol.symbolLayers.filter(
      (sublayer: any) => sublayer.enable
    );
    fillColor = extractFillColor(sublayers);
    [strokeColor, strokeWidth, strokeOpacity] = extractStroke(sublayers);
    markerSize =
      marker.size !== undefined
        ? marker.size
        : layer.size !== undefined
        ? layer.size
        : 10;
    if (markerGraphic.symbol.type === "CIMPointSymbol") {
      wellKnownName = marker.wellKnownName ?? "";
    } else if (
      ["CIMLineSymbol", "CIMPolygonSymbol"].includes(markerGraphic.symbol.type)
    ) {
      let shape = toWKT(
        markerGraphic.geometry !== undefined
          ? markerGraphic.geometry
          : undefined
      );
      wellKnownName = shape.wellKnownName;
      maxX = ptToPxProp(shape, "maxX", 0);
      maxY = ptToPxProp(shape, "maxY", 0);
    }
  }

  let marker: Marker = {
    opacity: 1.0,
    rotate: 0.0,
    kind: "Mark",
    color: fillColor,
    wellKnownName: wellKnownName,
    size: markerSize,
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    strokeOpacity: strokeOpacity,
    fillOpacity: 1.0,
    Z: 0,
  };
  if (maxX !== null) {
    marker["maxX"] = maxX;
  }
  if (maxY !== null) {
    marker["maxY"] = maxY;
  }

  let markerPlacement =
    layer.markerPlacement != undefined &&
    layer.markerPlacement.placementTemplate !== undefined
      ? layer.markerPlacement.placementTemplate
      : undefined;
  // Conversion of dash arrays is made on a case-by-case basis
  if (JSON.stringify(markerPlacement) === JSON.stringify([12, 3])) {
    marker["outlineDasharray"] = "4 0 4 7";
    marker["size"] = 6;
    marker["perpendicularOffset"] = -3.5;
  } else if (JSON.stringify(markerPlacement) === JSON.stringify([15])) {
    marker["outlineDasharray"] = "0 5 9 1";
    marker["size"] = 10;
  }

  return marker;
};

const processSymbolHatchFill = (layer: Layer): { [key: string]: any } => {
  let rotation = layer.rotation || 0;
  let symbolLayers = layer.lineSymbol.symbolLayers;
  let [color, width, opacity] = extractStroke(symbolLayers);

  // Use symbol and not rotation because rotation crops the line.
  let wellKnowName = hatchMarkerForAngle(rotation);
  if (rotation % 45) {
    WARNINGS.push(
      "Rotation value different than a multiple of 45° is not possible. The nearest value is taken instead."
    );
  }

  // Geoserver acts weird with tilted lines. Empirically, that's the best result so far:
  // Takes the double of the raw separation value. Line and dash lines are treated equally and are looking good.
  let rawSeparation = layer.separation || 0;
  let separation = getStraightHatchMarker().includes(wellKnowName)
    ? ptToPx(rawSeparation)
    : rawSeparation * 2;

  let fill: Fill = {
    kind: "Fill",
    opacity: 1.0,
    graphicFill: [
      {
        kind: "Mark",
        color: color,
        wellKnownName: wellKnowName,
        size: separation,
        strokeColor: color,
        strokeWidth: width,
        strokeOpacity: opacity,
        rotate: 0, // no rotation, use the symbol.
      },
    ],
    Z: 0,
  };

  let effects = extractEffect(symbolLayers[0]);
  if ("dasharray" in effects) {
    fill.graphicFill[0].outlineDasharray = effects.dasharray;

    // In case of dash array, the size must be at least as long as the dash pattern sum.
    if (separation > 0) {
      const dasharrayValues = effects.dasharrayValues as number[];
      let neededSize = dasharrayValues.reduce((a, b) => a + b, 0); // sum of array elements
      if (getStraightHatchMarker().includes(wellKnowName)) {
        // To keep the "original size" given by the separation value, we play with a negative margin.
        let negativeMargin = ((neededSize - separation) / 2) * -1;
        if (wellKnowName === getStraightHatchMarker()[0]) {
          fill["graphicFillMargin"] = [negativeMargin, 0, negativeMargin, 0];
        } else {
          fill["graphicFillMargin"] = [0, negativeMargin, 0, negativeMargin];
        }
      } else {
        // In case of tilted lines, the trick with the margin is not possible without cropping the pattern.
        neededSize = separation;
        WARNINGS.push(
          "Unable to keep the original size of CIMHatchFill for line with rotation"
        );
      }
      fill.graphicFill[0].size = neededSize;
    }
  }
  return fill;
};

const processSymbolPicture = (layer: any): { [key: string]: any } => {
  // let url = layer.url;
  // if (!existsSync(url)) {
  //     let tokens = url.split(';');
  //     if (tokens.length === 2) {
  //         let ext = tokens[0].split('/').pop();
  //         let data = tokens[1].substring('base64,'.length);
  //         let tempPath = path.join(
  //             tmpdir(),
  //             'bridgestyle',
  //             uuid.v4().replace('-', ''),
  //         );
  //         let iconName = `${uuid.v4()}.${ext}`;
  //         let iconFile = path.join(tempPath, iconName);
  //         mkdirSync(tempPath, { recursive: true });
  //         writeFileSync(iconFile, Buffer.from(data, 'base64'));
  //         usedIcons.push(iconFile);
  //         url = iconFile;
  //     }
  // }

  let size = ptToPxProp(layer, "height", ptToPxProp(layer, "size", 0));
  return {
    opacity: 1.0,
    rotate: 0.0,
    kind: "Icon",
    color: null,
    // image: url,
    image: "http://FIXME",
    size: size,
    Z: 0,
  };
};

const extractEffect = (layer: Record<string, any>): Record<string, any> => {
  let effects: Record<string, any> = {};
  if ("effects" in layer) {
    layer.effects.forEach((effect: any) => {
      effects = { ...effects, ...processEffect(effect) };
    });
  }
  return effects;
};

const processEffect = (effect: Record<string, any>): Record<string, any> => {
  let ptToPxAndCeil = (v: number) => {
    return Math.ceil(ptToPx(v));
  };

  if (effect.type === "CIMGeometricEffectDashes") {
    let dasharrayValues = effect.dashTemplate?.map(ptToPxAndCeil) || [];
    if (dasharrayValues.length > 1) {
      return {
        dasharrayValues: dasharrayValues,
        dasharray: dasharrayValues.join(" "),
      };
    }
  } else if (effect.type === "CIMGeometricEffectOffset") {
    return {
      offset: ptToPxAndCeil(effect.offset || 0) * -1,
    };
  }
  return {};
};

const getStraightHatchMarker = (): any => {
  return ["shape://horline", "shape://vertline"];
};

const getTiltedHatchMarker = (): any => {
  return ["shape://slash", "shape://backslash"];
};

const hatchMarkerForAngle = (angle: number): any => {
  const straightHatchMarkers = getStraightHatchMarker();
  const tiltedHatchMarkers = getTiltedHatchMarker();
  const quadrant = Math.floor(((angle + 22.5) % 180) / 45.0);

  return [
    straightHatchMarkers[0],
    tiltedHatchMarkers[0],
    straightHatchMarkers[1],
    tiltedHatchMarkers[1],
  ][quadrant];
};

const extractOffset = (symbolLayer: any): null | [number, number] => {
  let offsetX = ptToPxProp(symbolLayer, "offsetX", 0) * OFFSET_FACTOR;
  let offsetY = ptToPxProp(symbolLayer, "offsetY", 0) * OFFSET_FACTOR * -1;

  if (offsetX === 0 && offsetY !== 0) {
    return null;
  }
  return [offsetX, offsetY];
};
