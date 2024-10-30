import {ptToPx} from './constants.ts';
import {processColor, processOpacity} from './processUtils.ts';
import {CIMTextSymbol, SymbolLayer} from './esri/types/symbols';
import {WellKnownName} from 'geostyler-style';

export const WARNINGS: string[] = [];

export const toHex = (value: number): string => {
  return `0x${value.toString(16)}`;
};

export const esriFontToStandardSymbols = (charIndex: number): WellKnownName => {
  const mapping: { [index: number]: WellKnownName } = {
    33: 'circle',
    34: 'square',
    35: 'triangle',
    40: 'circle',
    41: 'square',
    42: 'triangle',
    94: 'star',
    95: 'star',
    203: 'cross',
    204: 'cross',
  };

  if (mapping.hasOwnProperty(charIndex)) {
    return mapping[charIndex];
  } else {
    WARNINGS.push(
      `Unsupported symbol from ESRI font (character index ${charIndex}) replaced by default marker`
    );
    return 'circle';
  }
};

export const ptToPxProp = (
  obj: unknown,
  prop: string,
  defaultValue: number,
  asFloat: boolean = true
): number => {
  if (!(obj !== null && typeof obj === 'object' && obj.hasOwnProperty(prop))) {
    return defaultValue;
  }
  const validObj = obj as Record<string, unknown>;
  const rawValue = parseFloat(validObj[prop] as string);
  if (isNaN(rawValue)) {
    return defaultValue;
  }
  const value = ptToPx(rawValue);
  return asFloat ? value : Math.round(value);
};

export const extractStroke = (
  symbolLayers: SymbolLayer[]
): [string, number, number] => {
  for (let sl of symbolLayers) {
    if (sl.type === 'CIMSolidStroke') {
      let color = processColor(sl.color ?? '');
      let width = ptToPxProp(sl, 'width', 0);
      let opacity = processOpacity(sl.color ?? '');
      return [color, width, opacity];
    }
  }
  return ['#000000', 0, 0];
};

export const extractFillColor = (symbolLayers: SymbolLayer[]): string => {
  let color: string = '#ffffff';
  symbolLayers.some(sl => {
    if (!sl.type) {
      return false;
    }
    if (sl.type === 'CIMSolidFill') {
      color = processColor(sl.color ?? '');
      return true;
    } else if (sl.type === 'CIMCharacterMarker') {
      if (sl.symbol.symbolLayers) {
        color = extractFillColor(sl.symbol.symbolLayers);
        return true;
      }
    }
    return false;
  });
  return color;
};

export const extractFillOpacity = (symbolLayers: SymbolLayer[]): number => {
  const symbolLayer = symbolLayers.find(sl => sl.type === 'CIMSolidFill');
  if (symbolLayer) {
    return processOpacity(symbolLayer.color);
  }
  return 1.0;
};

export const extractFontWeight = (textSymbol: CIMTextSymbol): ('bold'|'normal') => {
  return textSymbol.fontStyleName === 'Bold' ? 'bold' : 'normal';
};
