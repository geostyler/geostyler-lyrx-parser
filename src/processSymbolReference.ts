import { ESRI_SYMBOLS_FONT, POLYGON_FILL_RESIZE_FACTOR } from "./constants.ts";
import {
  esriFontToStandardSymbols,
  extractFillColor,
  extractFillOpacity,
  extractStroke,
  ptToPxProp,
  toHex,
} from "./toGeostylerUtils.ts";
import { Options } from "./types.ts";
import { processSymbolLayer } from "./processSymbolLayer.ts";
import {
  FillSymbolizer,
  LineSymbolizer,
  MarkSymbolizer,
  PointSymbolizer,
  Symbolizer,
  WellKnownName,
} from "geostyler-style";
import { CIMSymbolReference } from "./esri/types/labeling/CIMSymbolReference.ts";
import {
  CIMMarkerPlacement,
  CIMSymbol,
  SymbolLayer,
} from "./esri/types/symbols";
import { fieldToFProperty } from "./expressions.ts";

export const processSymbolReference = (
  symbolref: CIMSymbolReference,
  options: Options,
): Symbolizer[] => {
  const symbol = symbolref.symbol;
  const symbolizers: Symbolizer[] = [];
  if (!symbol || !symbol.symbolLayers) {
    return symbolizers;
  }
  // Drawing order for geostyler is inverse of rule order.
  const layers = symbol.symbolLayers.slice().reverse();
  layers.forEach((layer) => {
    // Skip not enabled layers.
    if (!layer.enable) {
      return;
    }
    // Skip layer without symbolizer.
    const symbolizer = processSymbolLayer(layer, symbol.type, options);
    if (!symbolizer) {
      return;
    }
    const layerSymbolizers = [symbolizer];
    if (
      ["CIMVectorMarker", "CIMPictureFill", "CIMCharacterMarker"].includes(
        layer.type,
      )
    ) {
      const symbolizerWithSubSymbolizer = processSymbolLayerWithSubSymbol(
        symbol,
        layer,
        symbolizer,
        options,
      );
      if (symbolizerWithSubSymbolizer.length) {
        // Replace symbolizer by a more complete one.
        layerSymbolizers.length = 0;
        layerSymbolizers.push(...symbolizerWithSubSymbolizer);
      }
    }
    symbolizers.push(...layerSymbolizers);
  });
  return symbolizers;
};

const processSymbolLayerWithSubSymbol = (
  symbol: CIMSymbol,
  layer: SymbolLayer,
  symbolizer: Symbolizer,
  options: Options,
): Symbolizer[] => {
  const symbolizers: Symbolizer[] = [];
  if (symbol.type === "CIMPolygonSymbol") {
    const markerPlacement = layer.markerPlacement || {};
    const polygonSymbolizer = formatPolygonSymbolizer(
      symbolizer as MarkSymbolizer,
      markerPlacement,
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
      return symbolizers;
    }
    // Not CIMCharacterMarker
    const lineSymbolizer = formatLineSymbolizer(symbolizer as PointSymbolizer);
    symbolizers.push(lineSymbolizer);
    return symbolizers;
  }
  return symbolizers;
};

const formatLineSymbolizer = (symbolizer: PointSymbolizer): LineSymbolizer => {
  return {
    kind: "Line",
    opacity: 1.0,
    perpendicularOffset: 0.0,
    graphicStroke: symbolizer,
    // @ts-ignore FIXME see issue #65
    graphicStrokeInterval: ptToPxProp(symbolizer, "size", 0) * 2,
    graphicStrokeOffset: 0.0,
  };
};

const formatPolygonSymbolizer = (
  symbolizer: MarkSymbolizer,
  markerPlacement: CIMMarkerPlacement,
): FillSymbolizer | LineSymbolizer | null => {
  const markerPlacementType = markerPlacement.type;
  if (markerPlacementType === "CIMMarkerPlacementInsidePolygon") {
    const margin = processMarkerPlacementInsidePolygon(
      symbolizer,
      markerPlacement,
    );
    return {
      kind: "Fill",
      opacity: 1.0,
      graphicFill: symbolizer,
      // @ts-ignore FIXME see issue #64
      graphicFillMargin: margin,
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
    geometry: [markerPositionFnc, ["PropertyName", "shape"]],
    // @ts-ignore FIXME see issue #66
    inclusion: "mapOnly",
  };
};

const processMarkerPlacementInsidePolygon = (
  symbolizer: MarkSymbolizer,
  markerPlacement: CIMMarkerPlacement,
): number[] => {
  const resizeFactor = symbolizer?.wellKnownName?.startsWith("wkt://POLYGON")
    ? 1
    : POLYGON_FILL_RESIZE_FACTOR;

  const radius = typeof symbolizer.radius === "number" ? symbolizer.radius : 0;
  const size = Math.round(radius * resizeFactor) || 1;
  symbolizer.radius = size;

  let maxX = size / 2;
  let maxY = size / 2;
  // @ts-ignore FIXME see issue #62
  const symMaxX = symbolizer?.maxX ?? maxX;
  // @ts-ignore FIXME see issue #62
  const symMaxY = symbolizer?.maxY ?? maxY;
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
