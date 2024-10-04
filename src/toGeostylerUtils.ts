import {ptToPx} from './constants.ts';
import {processColor, processOpacity} from './processUtils.ts';

export const WARNINGS: string[] = [];

export const toHex = (value: number): string => {
  return `0x${value.toString(16)}`;
};

export const esriFontToStandardSymbols = (charIndex: number): string => {
  const mapping: { [index: number]: string } = {
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
  obj: {
    [key: string]: any;
  },
  prop: string,
  defaultValue: number,
  asFloat: boolean = true
): number => {
  if (obj[prop] === undefined) {
    return defaultValue;
  }
  let value = ptToPx(parseFloat(obj[prop]));
  return asFloat ? value : Math.round(value);
};

export const extractStroke = (
  symbolLayers: any[]
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

export const extractFillColor = (symbolLayers: any[]): string => {
  let color: string = '#ffffff';
  for (let sl of symbolLayers) {
    if (sl.type === 'CIMSolidFill') {
      color = processColor(sl.color ?? '');
    } else if (sl.type === 'CIMCharacterMarker') {
      color = extractFillColor(sl.symbol.symbolLayers);
    }
  }
  return color;
};

export const extractFillOpacity = (symbolLayers: any[]): number => {
  for (let sl of symbolLayers) {
    if (sl.type === 'CIMSolidFill') {
      return processOpacity(sl.color);
    }
  }
  return 1.0;
};

export const extractFontWeight = (textSymbol: any): string => {
  return textSymbol.fontStyleName === 'Bold' ? 'bold' : 'normal';
};
