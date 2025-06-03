import { Effect, Options } from "./types.ts";
import { toWKT } from "./wktGeometries.ts";
import { ESRI_SYMBOLS_FONT, OFFSET_FACTOR, ptToPx } from "./constants.ts";
import { processColor, processOpacity } from "./processUtils.ts";
import {
  esriFontToStandardSymbols,
  extractFillColor,
  extractFillOpacity,
  extractStroke,
  ptToPxProp,
  toHex,
  WARNINGS,
} from "./toGeostylerUtils.ts";
import { processSymbolReference } from "./processSymbolReference.ts";
import {
  FillSymbolizer,
  LineSymbolizer,
  MarkSymbolizer,
  Symbolizer,
  WellKnownName,
} from "geostyler-style";
import { CIMEffect, SymbolLayer } from "./esri/types/symbols";
// import { writeFileSync, existsSync, mkdirSync } from 'fs';
// import uuid from 'uuid';
// import { tmpdir } from 'os';
// import path from 'path';

export const processSymbolLayer = (
  layer: SymbolLayer,
  symboltype: string,
  options: Options,
): Symbolizer | undefined => {
  let layerType: string = layer.type;
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

const processSymbolSolidStroke = (
  layer: SymbolLayer,
  symboltype: string,
): Symbolizer => {
  const effects = extractEffect(layer);
  if (symboltype === "CIMPolygonSymbol") {
    const fillSymbolizer: FillSymbolizer = {
      kind: "Fill",
      outlineColor: processColor(layer.color),
      outlineOpacity: processOpacity(layer.color),
      outlineWidth: ptToPxProp(layer, "width", 0),
    };
    if ("dasharray" in effects) {
      fillSymbolizer.outlineDasharray = effects.dasharray;
    }
    return fillSymbolizer;
  }
  const cap = layer.capStyle.toLowerCase();
  const join = layer.joinStyle.toLowerCase();
  const stroke: LineSymbolizer = {
    kind: "Line",
    color: processColor(layer.color),
    opacity: processOpacity(layer.color),
    width: ptToPxProp(layer, "width", 0),
    perpendicularOffset: 0,
    cap: ["butt", "round", "square"].includes(cap)
      ? (cap as "butt" | "round" | "square")
      : undefined,
    join: ["round", "bevel", "miter"].includes(join)
      ? (join as "round" | "bevel" | "miter")
      : undefined,
  };
  if ("dasharray" in effects) {
    stroke.dasharray = effects.dasharray;
  }
  if ("offset" in effects) {
    stroke.perpendicularOffset = effects.offset;
  }
  return stroke;
};

const processSymbolSolidFill = (
  layer: SymbolLayer,
): FillSymbolizer | undefined => {
  let color = layer.color;
  if (color === undefined) {
    return;
  }
  return {
    kind: "Fill",
    color: processColor(color),
    fillOpacity: processOpacity(color),
  };
};

const processSymbolCharacterMarker = (
  layer: SymbolLayer,
  options: Options,
): MarkSymbolizer => {
  const replaceesri = !!options.replaceesri;
  const fontFamily = layer.fontFamilyName;
  const charindex = layer.characterIndex;
  const hexcode = toHex(charindex);
  const size = ptToPxProp(layer, "size", 12);

  let name: WellKnownName;
  if (fontFamily === ESRI_SYMBOLS_FONT && replaceesri) {
    name = esriFontToStandardSymbols(charindex);
  } else {
    name = `ttf://${fontFamily}#${hexcode}` as WellKnownName;
  }

  let rotate = layer.rotation === undefined ? 0 : layer.rotation;

  // Rotation direction is by default counterclockwise in lyrx (clockwise in SLD)
  let rotateClockwise =
    layer.rotateClockwise === undefined ? false : layer.rotateClockwise;
  if (!rotateClockwise && rotate !== 0) {
    rotate *= -1;
  }

  let fillColor = "#000000";
  let fillOpacity = 1;
  let strokeColor = "#000000";
  let strokeWidth = 0;
  let strokeOpacity = 0;
  const symbolLayers = layer.symbol.symbolLayers;
  if (symbolLayers) {
    fillColor = extractFillColor(symbolLayers);
    fillOpacity = extractFillOpacity(symbolLayers);
    [strokeColor, strokeWidth, strokeOpacity] = extractStroke(symbolLayers);
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
    radius: size / 2,
  };
};

const processSymbolVectorMarker = (layer: SymbolLayer): MarkSymbolizer => {
  if (layer.size) {
    layer.size = ptToPxProp(layer, "size", 3);
  }
  // Default values
  let fillColor = "#ff0000";
  let strokeColor = "#000000";
  let strokeWidth = 1.0;
  let markerSize = 10;
  let strokeOpacity = 1;
  let wellKnownName: WellKnownName = "circle";
  let maxX: number | null = null;
  let maxY: number | null = null;

  let symbol: MarkSymbolizer;
  const markerGraphics =
    layer.markerGraphics !== undefined ? layer.markerGraphics : [];
  if (markerGraphics.length > 0) {
    // TODO: support multiple marker graphics
    const markerGraphic = markerGraphics[0];
    if (markerGraphic.symbol && markerGraphic.symbol.symbolLayers) {
      symbol = processSymbolReference(markerGraphic, {})[0] as MarkSymbolizer;
      const subLayers = markerGraphic.symbol.symbolLayers.filter(
        (sublayer: SymbolLayer) => sublayer.enable,
      );
      fillColor = extractFillColor(subLayers);
      [strokeColor, strokeWidth, strokeOpacity] = extractStroke(subLayers);
      const layerSize = layer.size !== undefined ? layer.size : 10;
      markerSize =
        typeof symbol.radius === "number" ? symbol.radius : layerSize;
      if (markerGraphic.symbol.type === "CIMPointSymbol") {
        wellKnownName = symbol.wellKnownName ?? wellKnownName;
      } else if (
        ["CIMLineSymbol", "CIMPolygonSymbol"].includes(
          markerGraphic.symbol.type,
        )
      ) {
        const geometry = markerGraphic.geometry;
        if (geometry) {
          const shape = toWKT(geometry);
          wellKnownName = shape.wellKnownName;
          maxX = ptToPxProp(shape, "maxX", 0);
          maxY = ptToPxProp(shape, "maxY", 0);
        }
      }
    }
  }

  // TODO marker should support outlineDasharray ?
  const marker: MarkSymbolizer = {
    opacity: 1,
    rotate: 0,
    kind: "Mark",
    color: fillColor,
    wellKnownName: wellKnownName,
    radius: markerSize / 2,
    strokeColor: strokeColor,
    strokeWidth: strokeWidth,
    strokeOpacity: strokeOpacity,
    fillOpacity: 1,
  };
  if (maxX !== null) {
    // @ts-ignore FIXME see issue #62
    marker.maxX = maxX;
  }
  if (maxY !== null) {
    // @ts-ignore FIXME see issue #62
    marker.maxY = maxY;
  }

  const markerPlacement =
    layer.markerPlacement !== undefined &&
    layer.markerPlacement.placementTemplate !== undefined
      ? layer.markerPlacement.placementTemplate
      : undefined;
  // Conversion of dash arrays is made on a case-by-case basis
  if (JSON.stringify(markerPlacement) === JSON.stringify([12, 3])) {
    // @ts-ignore FIXME see issue #63
    marker.outlineDasharray = "4 0 4 7";
    marker.radius = 3;
    // @ts-ignore FIXME see issue #63
    marker.perpendicularOffset = -3.5;
  } else if (JSON.stringify(markerPlacement) === JSON.stringify([15])) {
    // @ts-ignore FIXME see issue #63
    marker.outlineDasharray = "0 5 9 1";
    marker.radius = 5;
  }

  return marker;
};

const processSymbolHatchFill = (layer: SymbolLayer): Symbolizer => {
  const rotation = layer.rotation || 0;
  const symbolLayers = layer.lineSymbol.symbolLayers;
  let color = "#000000";
  let width = 0;
  let opacity = 0;
  if (symbolLayers) {
    [color, width, opacity] = extractStroke(symbolLayers);
  }

  // Use symbol and not rotation because rotation crops the line.
  let wellKnowName = hatchMarkerForAngle(rotation);
  if (rotation % 45) {
    WARNINGS.push(
      "Rotation value different than a multiple of 45° is not possible. The nearest value is taken instead.",
    );
  }

  // Geoserver acts weird with tilted lines. Empirically, that's the best result so far:
  // Takes the double of the raw separation value. Line and dash lines are treated equally and are looking good.
  let rawSeparation = layer.separation || 0;
  let separation = getStraightHatchMarker().includes(wellKnowName)
    ? ptToPx(rawSeparation)
    : rawSeparation * 2;

  const markSymbolizer: MarkSymbolizer = {
    kind: "Mark",
    color: color,
    wellKnownName: wellKnowName,
    radius: separation,
    strokeColor: color,
    strokeWidth: width,
    strokeOpacity: opacity,
    rotate: 0, // no rotation, use the symbol.
  };

  const fillSymbolizer: FillSymbolizer = {
    kind: "Fill",
    fillOpacity: 1.0,
    graphicFill: markSymbolizer,
  };

  if (!symbolLayers) {
    return fillSymbolizer;
  }

  let effects = extractEffect(symbolLayers[0]);
  if ("dasharray" in effects) {
    // @ts-ignore FIXME see issue #63
    fillSymbolizer.graphicFill!.outlineDasharray = effects.dasharray;

    // In case of dash array, the size must be at least as long as the dash pattern sum.
    if (separation > 0) {
      const dasharrayValues = effects.dasharrayValues as number[];
      let neededSize = dasharrayValues.reduce((a, b) => a + b, 0); // sum of array elements
      if (getStraightHatchMarker().includes(wellKnowName)) {
        // To keep the "original size" given by the separation value, we play with a negative margin.
        let negativeMargin = ((neededSize - separation) / 2) * -1;
        if (wellKnowName === getStraightHatchMarker()[0]) {
          fillSymbolizer.graphicFillPadding = [
            negativeMargin,
            0,
            negativeMargin,
            0,
          ];
        } else {
          fillSymbolizer.graphicFillPadding = [
            0,
            negativeMargin,
            0,
            negativeMargin,
          ];
        }
      } else {
        // In case of tilted lines, the trick with the margin is not possible without cropping the pattern.
        neededSize = separation;
        WARNINGS.push(
          "Unable to keep the original size of CIMHatchFill for line with rotation",
        );
      }
      markSymbolizer.radius = neededSize;
    }
  }
  return fillSymbolizer;
};

const processSymbolPicture = (layer: SymbolLayer): Symbolizer => {
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
    color: undefined,
    // image: url,
    image: "http://FIXME",
    size: size,
  };
};

const extractEffect = (layer: SymbolLayer): Effect => {
  let effects: Effect = {};
  if ("effects" in layer) {
    layer.effects.forEach((effect: CIMEffect) => {
      effects = { ...effects, ...processEffect(effect) };
    });
  }
  return effects;
};

const processEffect = (effect: CIMEffect): Effect => {
  let ptToPxAndCeil = (v: number) => {
    return Math.ceil(ptToPx(v));
  };

  if (effect.type === "CIMGeometricEffectDashes") {
    let dasharrayValues = effect.dashTemplate?.map(ptToPxAndCeil) || [];
    if (dasharrayValues.length > 1) {
      return {
        dasharrayValues: dasharrayValues,
        dasharray: dasharrayValues, // TODO was a string, can be simplified now
      };
    }
  } else if (effect.type === "CIMGeometricEffectOffset") {
    return {
      offset: ptToPxAndCeil(effect.offset || 0) * -1,
    };
  }
  return {};
};

const getStraightHatchMarker = (): WellKnownName[] => {
  return ["shape://horline", "shape://vertline"];
};

const getTiltedHatchMarker = (): WellKnownName[] => {
  return ["shape://slash", "shape://backslash"];
};

const hatchMarkerForAngle = (angle: number): WellKnownName => {
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

const extractOffset = (
  symbolLayer: SymbolLayer,
): undefined | [number, number] => {
  // Arcgis looks to apply a strange factor.
  let offsetX = ptToPxProp(symbolLayer, "offsetX", 0) * OFFSET_FACTOR;
  let offsetY = ptToPxProp(symbolLayer, "offsetY", 0) * OFFSET_FACTOR * -1;

  if (offsetX === 0 && offsetY !== 0) {
    return undefined;
  }
  return [offsetX, offsetY];
};
