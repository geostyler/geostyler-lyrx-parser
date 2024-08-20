import {
  ESRI_SYMBOLS_FONT,
  MarkerPlacementAngle,
  MarkerPlacementPosition,
  POLYGON_FILL_RESIZE_FACTOR,
} from './constants';
import {
  esriFontToStandardSymbols,
  extractFillColor,
  extractFillOpacity,
  extractStroke,
  ptToPxProp, toHex,
} from './toGeostylerUtils';
import {
  MarkerPlacement,
  Options,
  Symbolizer,
} from './badTypes';
import { processSymbolLayer } from './processSymbolLayer';

export const processSymbolReference = (
  symbolref: any,
  options: Options
): Symbolizer[] => {
  const symbol = symbolref.symbol;
  const symbolizers: Symbolizer[] = [];
  if (!symbol.symbolLayers) {
    return symbolizers;
  }

  for (const layer of symbol.symbolLayers.slice().reverse()) {
    // drawing order for geostyler is inverse of rule order
    if (!layer.enable) {
      continue;
    }
    let symbolizer = processSymbolLayer(layer, symbol.type, options);
    if (!symbolizer) {
      continue;
    }
    if (
      ['CIMVectorMarker', 'CIMPictureFill', 'CIMCharacterMarker'].includes(
        layer.type
      )
    ) {
      if (symbol.type === 'CIMLineSymbol') {
        if (layer.type === 'CIMCharacterMarker') {
          if (orientedMarkerAtStartOfLine(layer.markerPlacement)) {
            symbolizer = processOrientedMarkerAtEndOfLine(
              layer,
              'start',
              options
            );
            symbolizers.push(symbolizer);
          }
          if (orientedMarkerAtEndOfLine(layer.markerPlacement)) {
            symbolizer = processOrientedMarkerAtEndOfLine(
              layer,
              'end',
              options
            );
            symbolizers.push(symbolizer);
          }
          continue;
        } else {
          symbolizer = formatLineSymbolizer(symbolizer);
        }
      } else if (symbol.type === 'CIMPolygonSymbol') {
        const markerPlacement = layer.markerPlacement || {};
        symbolizer = formatPolygonSymbolizer(symbolizer, markerPlacement);
      }
    }
    symbolizers.push(symbolizer);
  }

  return symbolizers;
};

const formatLineSymbolizer = (symbolizer: Symbolizer): Symbolizer => {
  return {
    kind: 'Line',
    opacity: 1.0,
    perpendicularOffset: 0.0,
    graphicStroke: [symbolizer],
    graphicStrokeInterval: ptToPxProp(symbolizer, 'size', 0) * 2, // TODO
    graphicStrokeOffset: 0.0,
    Z: 0,
  };
};

const formatPolygonSymbolizer = (
  symbolizer: Symbolizer,
  markerPlacement: MarkerPlacement
): Symbolizer | null => {
  const markerPlacementType = markerPlacement.type;
  if (markerPlacementType == 'CIMMarkerPlacementInsidePolygon') {
    const margin = processMarkerPlacementInsidePolygon(
      symbolizer,
      markerPlacement
    );
    return {
      kind: 'Fill',
      opacity: 1.0,
      perpendicularOffset: 0.0,
      graphicFill: [symbolizer],
      graphicFillMargin: margin,
      Z: 0,
    };
  }
  if (markerPlacementType == 'CIMMarkerPlacementAlongLineSameSize') {
    return {
      kind: 'Line',
      opacity: 1.0,
      size: ptToPxProp(symbolizer, 'size', 10),
      perpendicularOffset: ptToPxProp(symbolizer, 'perpendicularOffset', 0.0),
      graphicStroke: [symbolizer],
      Z: 0,
    };
  }
  return null;
};

const processOrientedMarkerAtEndOfLine = (
  layer: Record<string, any>,
  orientedMarker: string,
  options: Record<string, any>
): Record<string, any> | undefined => {
  let markerPositionFnc: string, markerRotationFnc: string, rotation: number;

  if (orientedMarker === 'start') {
    markerPositionFnc = MarkerPlacementPosition.START;
    markerRotationFnc = MarkerPlacementAngle.START;
    rotation = layer?.rotation ?? 180;
  } else if (orientedMarker === 'end') {
    markerPositionFnc = MarkerPlacementPosition.END;
    markerRotationFnc = MarkerPlacementAngle.END;
    rotation = layer?.rotation ?? 0;
  } else {
    return undefined;
  }

  const replaceesri = !!options?.replaceesri;
  const fontFamily = layer.fontFamilyName;
  const charindex = layer.characterIndex;
  const hexcode = toHex(charindex);

  let name;
  if (fontFamily === ESRI_SYMBOLS_FONT && replaceesri) {
    name = esriFontToStandardSymbols(charindex);
  } else {
    name = `ttf://${fontFamily}#${hexcode}`;
  }

  let symbolLayers,
    fillColor,
    fillOpacity,
    strokeColor,
    strokeWidth,
    strokeOpacity;

  try {
    symbolLayers = layer.symbol.symbolLayers;
    fillColor = extractFillColor(symbolLayers);
    fillOpacity = extractFillOpacity(symbolLayers);
    [strokeColor, strokeWidth, strokeOpacity] = extractStroke(symbolLayers);
  } catch (error) {
    fillColor = '#000000';
    fillOpacity = 1.0;
    strokeOpacity = 0.0;
    strokeColor = '#000000';
    strokeWidth = 0.0;
  }

  return {
    opacity: 1.0,
    fillOpacity: fillOpacity,
    strokeColor: strokeColor,
    strokeOpacity: strokeOpacity,
    strokeWidth: strokeWidth,
    rotate: ['Add', [markerRotationFnc, ['PropertyName', 'shape']], rotation],
    kind: 'Mark',
    color: fillColor,
    wellKnownName: name,
    size: ptToPxProp(layer, 'size', 10),
    Z: 0,
    Geometry: [markerPositionFnc, ['PropertyName', 'shape']],
    inclusion: 'mapOnly',
  };
};

const processMarkerPlacementInsidePolygon = (
  symbolizer: Record<string, any>,
  markerPlacement: Record<string, any>
): number[] => {
  let resizeFactor = symbolizer?.wellKnownName?.startsWith('wkt://POLYGON')
    ? 1
    : POLYGON_FILL_RESIZE_FACTOR;

  let size = Math.round((symbolizer?.size ?? 0) * resizeFactor) || 1;
  symbolizer.size = size;

  let maxX = size / 2,
    maxY = size / 2;
  if (symbolizer?.maxX && symbolizer?.maxY) {
    maxX = Math.floor(symbolizer.maxX * resizeFactor) || 1;
    maxY = Math.floor(symbolizer.maxY * resizeFactor) || 1;
  }

  let stepX = ptToPxProp(markerPlacement, 'stepX', 0);
  let stepY = ptToPxProp(markerPlacement, 'stepY', 0);

  if (stepX < maxX) {
    stepX += maxX * 2;
  }

  if (stepY < maxY) {
    stepY += maxY * 2;
  }

  let offsetX = ptToPxProp(markerPlacement, 'offsetX', 0);
  let offsetY = ptToPxProp(markerPlacement, 'offsetY', 0);

  let right = Math.round(stepX / 2 - maxX - offsetX);
  let left = Math.round(stepX / 2 - maxX + offsetX);
  let top = Math.round(stepY / 2 - maxY - offsetY);
  let bottom = Math.round(stepY / 2 - maxY + offsetY);

  return [top, right, bottom, left];
};

const orientedMarkerAtStartOfLine = (markerPlacement: any): boolean => {
  if (markerPlacement?.angleToLine) {
    if (
      markerPlacement.type === 'CIMMarkerPlacementAtRatioPositions' &&
      markerPlacement.positionArray[0] === 0 &&
      markerPlacement.flipFirst
    ) {
      return true;
    } else if (markerPlacement.type === 'CIMMarkerPlacementAtExtremities') {
      return (
        markerPlacement.extremityPlacement === 'Both' ||
        markerPlacement.extremityPlacement === 'JustBegin'
      );
    }
  }
  return false;
};

const orientedMarkerAtEndOfLine = (
  markerPlacement: MarkerPlacement
): boolean => {
  if (markerPlacement?.angleToLine) {
    if (
      markerPlacement.type === 'CIMMarkerPlacementAtRatioPositions' &&
      markerPlacement.positionArray[0] === 1
    ) {
      return true;
    } else if (markerPlacement.type === 'CIMMarkerPlacementAtExtremities') {
      return (
        markerPlacement.extremityPlacement === 'Both' ||
        markerPlacement.extremityPlacement === 'JustEnd'
      );
    }
  }
  return false;
};
