import { Effect, Options } from "./types.ts";
import { toWKT } from "./wktGeometries.ts";
import {
  ESRI_SYMBOLS_FONT,
  OFFSET_FACTOR,
  POLYGON_FILL_RESIZE_FACTOR,
  ptToPx,
} from "./constants.ts";
import {
  angleIn360Degrees,
  processColor,
  processOpacity,
} from "./processUtils.ts";
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
  Expression,
  FillSymbolizer,
  LineSymbolizer,
  MarkSymbolizer,
  PointSymbolizer,
  Symbolizer,
  WellKnownName,
} from "geostyler-style";
import {
  CIMEffect,
  CIMMarkerPlacement,
  CIMSymbol,
  SymbolLayer,
} from "./esri/types/symbols";
import { fieldToFProperty } from "./expressions.ts";
// import { writeFileSync, existsSync, mkdirSync } from 'fs';
// import uuid from 'uuid';
// import { tmpdir } from 'os';
// import path from 'path';

export const processSymbolLayer = (
  layer: SymbolLayer,
  symbol: CIMSymbol,
  options: Options,
): Symbolizer[] | undefined => {
  let layerType: string = layer.type;

  switch (layerType) {
    case "CIMSolidStroke":
      return processSymbolSolidStroke(layer, symbol.type);
    case "CIMSolidFill":
      return processSymbolSolidFill(layer);
    case "CIMCharacterMarker":
      return processSymbolCharacterMarker(layer, symbol, options);
    case "CIMVectorMarker":
      return processSymbolVectorMarker(layer, symbol, options);
    case "CIMHatchFill":
      return processSymbolHatchFill(layer);
    case "CIMPictureFill":
      return processSymbolPicture(layer, symbol, options);
    case "CIMPictureMarker":
      return processSymbolMarker(layer);
    default:
      return;
  }
};

const processSymbolLayerWithSubSymbol = (
  symbol: CIMSymbol,
  layer: SymbolLayer,
  symbolizer: Symbolizer,
  options: Options,
  maxX: number | null = null,
  maxY: number | null = null,
): Symbolizer[] => {
  const symbolizers: Symbolizer[] = [];
  if (symbol.type === "CIMPolygonSymbol") {
    const markerPlacement = layer.markerPlacement || {};
    const polygonSymbolizer = formatPolygonSymbolizer(
      symbolizer as MarkSymbolizer,
      markerPlacement,
      maxX,
      maxY,
    );
    if (polygonSymbolizer) {
      symbolizers.push(polygonSymbolizer);
    }
    return symbolizers;
  }
  if (symbol.type === "CIMLineSymbol") {
    if (layer.type === "CIMCharacterMarker") {
      if (orientedMarkerAtStartOfLine(layer.markerPlacement)) {
        const startSymbolizer = processOrientedMarkerAtEndOfLine(
          layer,
          "start",
          options,
        );
        if (startSymbolizer) {
          symbolizers.push(startSymbolizer);
        }
      }
      if (orientedMarkerAtEndOfLine(layer.markerPlacement)) {
        const endSymbolizer = processOrientedMarkerAtEndOfLine(
          layer,
          "end",
          options,
        );
        if (endSymbolizer) {
          symbolizers.push(endSymbolizer);
        }
      }
      const lineSymbolizer = formatLineSymbolizer(
        symbolizer as PointSymbolizer,
        layer as SymbolLayer,
      );
      symbolizers.push(lineSymbolizer);
      return symbolizers;
    }
    // Not CIMCharacterMarker
    const lineSymbolizer = formatLineSymbolizer(
      symbolizer as PointSymbolizer,
      layer as SymbolLayer,
    );
    symbolizers.push(lineSymbolizer);
    return symbolizers;
  }
  return symbolizers;
};

const formatLineSymbolizer = (
  symbolizer: PointSymbolizer,
  layer: SymbolLayer,
): LineSymbolizer => {
  const lineSymbolizer: LineSymbolizer = {
    kind: "Line",
    opacity: 1.0,
    graphicStroke: symbolizer,
  };
  const markerPlacement = layer.markerPlacement;
  if (layer.markerPlacement.type === "CIMMarkerPlacementAlongLineSameSize") {
    const size = ptToPxProp(layer, "size", 10);
    const template = processMarkerPlacementAlongLine(markerPlacement, size);
    if (symbolizer.kind === "Mark") {
      if (
        !symbolizer.wellKnownName.startsWith("wkt://") &&
        symbolizer.strokeWidth === 0
      ) {
        // If the marker has a known shape with strokeWidth of 0, we don't want to render it because Geoserver still draws a line.
        delete symbolizer.strokeWidth;
        delete symbolizer.strokeColor;
        delete symbolizer.strokeOpacity;
      }
    }
    lineSymbolizer.width = size;
    lineSymbolizer.perpendicularOffset = ptToPxProp(
      symbolizer,
      "perpendicularOffset",
      0.0,
    );
    lineSymbolizer.dasharray = template;
    return lineSymbolizer;
  }
  lineSymbolizer.perpendicularOffset = 0;
  // @ts-ignore FIXME see issue #65
  lineSymbolizer.graphicStrokeInterval = ptToPxProp(symbolizer, "size", 0) * 2;
  // @ts-ignore FIXME see issue #65
  lineSymbolizer.graphicStrokeOffset = 0.0;
  return lineSymbolizer;
};

const processMarkerPlacementAlongLine = (
  markerPlacement: CIMMarkerPlacement,
  size: number,
): number[] => {
  const placementTemplate = markerPlacement?.placementTemplate;

  if (!placementTemplate || !placementTemplate.length) {
    return [];
  }
  if (placementTemplate.length === 1) {
    // The markers are placed with the same distance.
    const distance = ptToPx(placementTemplate[0]);
    // The distance must be larger than the size of the marker and we add a default spacing of 1, which is not necessary in lyrx
    return distance >= size + 1 ? [distance, 1] : [size + 1, 1];
  } else {
    // The markers are placed with different distances.
    const templateLength = placementTemplate.length * size;
    let ptToPxAndCeil = (v: number) => {
      return Math.ceil(ptToPx(v));
    };
    // We must calculate the dasharray length the same way as for the CIMGeometricEffectDashes
    const dasharrayValues = placementTemplate?.map(ptToPxAndCeil) || [];
    const totalDasharray = dasharrayValues.reduce(
      (sum, value) => sum + value,
      0,
    );
    // The length of the markers is the templateLength. For the whole pattern we need to caluculate the appropriate spacing.
    const spacing = totalDasharray - templateLength;
    return [templateLength, spacing];
  }
};

const formatPolygonSymbolizer = (
  symbolizer: MarkSymbolizer,
  markerPlacement: CIMMarkerPlacement,
  maxX: number | null = null,
  maxY: number | null = null,
): FillSymbolizer | LineSymbolizer | null => {
  const markerPlacementType = markerPlacement.type;
  if (markerPlacementType === "CIMMarkerPlacementInsidePolygon") {
    const padding = processMarkerPlacementInsidePolygon(
      symbolizer,
      markerPlacement,
      maxX,
      maxY,
    );
    return {
      kind: "Fill",
      opacity: 1.0,
      graphicFill: symbolizer,
      graphicFillPadding: padding,
    };
  }
  if (markerPlacementType === "CIMMarkerPlacementAlongLineSameSize") {
    return {
      kind: "Line",
      opacity: 1.0,
      width: ptToPxProp(symbolizer, "size", 10),
      perpendicularOffset: ptToPxProp(symbolizer, "perpendicularOffset", 0.0),
      graphicStroke: symbolizer,
    };
  }
  return null;
};

const processOrientedMarkerAtEndOfLine = (
  layer: SymbolLayer,
  orientedMarker: string,
  options: Options,
): MarkSymbolizer | undefined => {
  // let markerPositionFnc: string;
  // let markerRotationFnc: string;
  let rotation: number;

  if (orientedMarker === "start") {
    // markerPositionFnc = MarkerPlacementPosition.START;
    // markerRotationFnc = MarkerPlacementAngle.START;
    rotation = layer?.rotation ?? 180;
  } else if (orientedMarker === "end") {
    // markerPositionFnc = MarkerPlacementPosition.END;
    // markerRotationFnc = MarkerPlacementAngle.END;
    rotation = layer?.rotation ?? 0;
  } else {
    return undefined;
  }

  const replaceesri = !!options?.replaceesri;
  const fontFamily = layer.fontFamilyName;
  const charindex = layer.characterIndex;
  const hexcode = toHex(charindex);

  let name: WellKnownName;
  if (fontFamily === ESRI_SYMBOLS_FONT && replaceesri) {
    name = esriFontToStandardSymbols(charindex);
  } else {
    name = `ttf://${fontFamily}#${hexcode}` as WellKnownName;
  }

  let symbolLayers,
    fillColor,
    fillOpacity,
    strokeColor,
    strokeWidth,
    strokeOpacity;

  try {
    symbolLayers = layer.symbol.symbolLayers ?? [];
    fillColor = extractFillColor(symbolLayers);
    fillOpacity = extractFillOpacity(symbolLayers);
    [strokeColor, strokeWidth, strokeOpacity] = extractStroke(symbolLayers);
  } catch (error) {
    fillColor = "#000000";
    fillOpacity = 1.0;
    strokeOpacity = 0.0;
    strokeColor = "#000000";
    strokeWidth = 0.0;
  }

  const fProperty = fieldToFProperty("shape", true);
  return {
    opacity: 1.0,
    fillOpacity: fillOpacity,
    strokeColor: strokeColor,
    strokeOpacity: strokeOpacity,
    strokeWidth: strokeWidth,
    // FIXME see issue #66 use markerRotationFnc ? Previous code was:
    // rotate: ['Add', [markerRotationFnc, ['PropertyName', 'shape']], rotation],
    rotate: { args: [fProperty, rotation], name: "add" },
    kind: "Mark",
    color: fillColor,
    wellKnownName: name,
    radius: ptToPxProp(layer, "size", 10),
    // @ts-ignore FIXME see issue #66
    geometry: [null, ["PropertyName", "shape"]],
    // geometry: [markerPositionFnc, ["PropertyName", "shape"]],
    // @ts-ignore FIXME see issue #66
    // Functions "endPoint" and "endAngle" are not supported in the legend in GeoServer,
    // so we include this symbol only on the map and not in the legend
    inclusion: "mapOnly",
  };
};

const processMarkerPlacementInsidePolygon = (
  symbolizer: MarkSymbolizer,
  markerPlacement: CIMMarkerPlacement,
  symMaxX: number | null = null,
  symMaxY: number | null = null,
): [
  Expression<number>,
  Expression<number>,
  Expression<number>,
  Expression<number>,
] => {
  // In case of markers in a polygon fill, it seems ArcGIS does some undocumented resizing of the marker.
  // We use an empirical factor to account for this, which works in most cases (but not all)
  const resizeFactor = symbolizer?.wellKnownName?.startsWith("wkt://POLYGON")
    ? 1
    : POLYGON_FILL_RESIZE_FACTOR;

  const radius = typeof symbolizer.radius === "number" ? symbolizer.radius : 0;

  // Size is already in pixel.
  // Avoid null values and force them to 1 px
  const size = Math.round(radius * resizeFactor) || 1;
  symbolizer.radius = size;
 
  // We use SLD graphic-margin as top, right, bottom, left to mimic the combination of
  // ArcGIS stepX, stepY, offsetX, offsetY
  let maxX = size / 2;
  let maxY = size / 2;

  symMaxX = symMaxX ?? maxX;
  symMaxY = symMaxY ?? maxY;
  if (symMaxX && symMaxY) {
    maxX = Math.floor(symMaxX * resizeFactor) || 1;
    maxY = Math.floor(symMaxY * resizeFactor) || 1;
  }

  let stepX = ptToPxProp(markerPlacement, "stepX", 0);
  let stepY = ptToPxProp(markerPlacement, "stepY", 0);

  if (stepX < maxX) {
    stepX += maxX * 2;
  }

  if (stepY < maxY) {
    stepY += maxY * 2;
  }

  const offsetX = ptToPxProp(markerPlacement, "offsetX", 0);
  const offsetY = ptToPxProp(markerPlacement, "offsetY", 0);

  const right = Math.round(stepX / 2 - maxX - offsetX);
  const left = Math.round(stepX / 2 - maxX + offsetX);
  const top = Math.round(stepY / 2 - maxY - offsetY);
  const bottom = Math.round(stepY / 2 - maxY + offsetY);

  return [top, right, bottom, left];
};

const orientedMarkerAtStartOfLine = (
  markerPlacement: CIMMarkerPlacement,
): boolean => {
  if (markerPlacement?.angleToLine) {
    if (
      markerPlacement.type === "CIMMarkerPlacementAtRatioPositions" &&
      markerPlacement.positionArray[0] === 0 &&
      markerPlacement.flipFirst
    ) {
      return true;
    } else if (markerPlacement.type === "CIMMarkerPlacementAtExtremities") {
      return (
        markerPlacement.extremityPlacement === "Both" ||
        markerPlacement.extremityPlacement === "JustBegin"
      );
    }
  }
  return false;
};

const orientedMarkerAtEndOfLine = (
  markerPlacement: CIMMarkerPlacement,
): boolean => {
  if (markerPlacement?.angleToLine) {
    if (
      markerPlacement.type === "CIMMarkerPlacementAtRatioPositions" &&
      markerPlacement.positionArray[0] === 1
    ) {
      return true;
    } else if (markerPlacement.type === "CIMMarkerPlacementAtExtremities") {
      return (
        markerPlacement.extremityPlacement === "Both" ||
        markerPlacement.extremityPlacement === "JustEnd"
      );
    }
  }
  return false;
};

const processSymbolSolidStroke = (
  layer: SymbolLayer,
  symboltype: string,
): Symbolizer[] => {
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
    return [fillSymbolizer];
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
  return [stroke];
};

const processSymbolSolidFill = (
  layer: SymbolLayer,
): Symbolizer[] | undefined => {
  let color = layer.color;
  if (color === undefined) {
    return;
  }
  return [
    {
      kind: "Fill",
      color: processColor(color),
      fillOpacity: processOpacity(color),
    } as Symbolizer,
  ];
};

const processSymbolCharacterMarker = (
  layer: SymbolLayer,
  symbol: CIMSymbol,
  options: Options,
): Symbolizer[] => {
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

  const symbolCharacterMaker = {
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
  } as Symbolizer;

  const symbolizerWithSubSymbolizer = processSymbolLayerWithSubSymbol(
    symbol,
    layer,
    symbolCharacterMaker,
    options,
  );
  if (symbolizerWithSubSymbolizer.length) {
    return symbolizerWithSubSymbolizer;
  }

  return [symbolCharacterMaker];
};

const processSymbolVectorMarker = (
  layer: SymbolLayer,
  cimSymbol: CIMSymbol,
  options: Options,
): Symbolizer[] => {
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

  const symbolizerWithSubSymbolizer = processSymbolLayerWithSubSymbol(
    cimSymbol,
    layer,
    marker,
    options,
    maxX,
    maxY,
  );
  if (symbolizerWithSubSymbolizer.length) {
    return symbolizerWithSubSymbolizer;
  }

  return [marker];
};

const processSymbolHatchFill = (layer: SymbolLayer): Symbolizer[] => {
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
  // For the straight hatch markers, it looks that dividing the value by 2 gives best results.
  let rawSeparation = layer.separation || 0;
  let separation = getStraightHatchMarker().includes(wellKnowName)
    ? ptToPx(rawSeparation) / 2
    : rawSeparation;
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
    return [fillSymbolizer];
  }

  let effects = extractEffect(symbolLayers[0]);
  if ("dasharray" in effects) {
    markSymbolizer.strokeDasharray = effects.dasharray;
    // In case of dash array, the size must be at least as long as the dash pattern sum.
    if (separation > 0) {
      const dasharrayValues = effects.dasharrayValues as number[];
      let neededSize = dasharrayValues.reduce((a, b) => a + b, 0); // sum of array elements
      if (getStraightHatchMarker().includes(wellKnowName)) {
        // For the straight hatch markers, it looks that dividing the value by 2 gives best results.
        neededSize = neededSize / 2;
        // To keep the "original size" given by the separation value, we play with a negative margin.
        let negativeMargin = ((neededSize - separation)) * -1;
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
  return [fillSymbolizer];
};

const processSymbolPicture = (
  layer: SymbolLayer,
  cimSymbol: CIMSymbol,
  options: Options,
): Symbolizer[] => {
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
  const picureFillSymbolizer: Symbolizer = {
    opacity: 1.0,
    rotate: 0.0,
    kind: "Icon",
    color: undefined,
    // image: url,
    image: "http://FIXME",
    size: size,
  };

  const symbolizerWithSubSymbolizer = processSymbolLayerWithSubSymbol(
    cimSymbol,
    layer,
    picureFillSymbolizer,
    options,
  );
  if (symbolizerWithSubSymbolizer.length) {
    return symbolizerWithSubSymbolizer;
  }
  return [picureFillSymbolizer];
};

const processSymbolMarker = (layer: SymbolLayer): Symbolizer[] => {
  let size = ptToPxProp(layer, "height", ptToPxProp(layer, "size", 0));
  return [
    {
      opacity: 1.0,
      rotate: 0.0,
      kind: "Icon",
      color: undefined,
      // image: url,
      image: "http://FIXME",
      size: size,
    } as Symbolizer,
  ];
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
  const angle360 = angleIn360Degrees(angle);
  const straightHatchMarkers = getStraightHatchMarker();
  const tiltedHatchMarkers = getTiltedHatchMarker();
  const quadrant = Math.floor(((angle360 + 22.5) % 180) / 45.0);

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
