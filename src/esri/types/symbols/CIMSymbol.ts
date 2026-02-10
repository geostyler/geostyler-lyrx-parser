import { CIMObject } from "../CIMObject.ts";
import { CIMColor } from "./CIMTextSymbol.ts";
import { CIMSymbolReference } from "../labeling";
import { Frame } from "./Frame.ts";

export type CIMColorType = CIMColor & CIMObject;

export type CIMMarkerPlacement = CIMObject & {
  angleToLine: boolean;
  extremityPlacement: string;
  flipFirst: boolean;
  placementTemplate: number[];
  positionArray: number[];
};

export type CIMEffect = CIMObject & {
  dashTemplate: number[];
  offset: number;
};

export type SymbolLayer = CIMObject & {
  capStyle: string;
  characterIndex: number;
  color: CIMColorType;
  effects: CIMEffect[];
  enable: boolean;
  fontFamilyName: string;
  joinStyle: string;
  lineSymbol: CIMSymbol;
  markerPlacement: CIMMarkerPlacement;
  markerGraphics: CIMSymbolReference[];
  rotateClockwise: boolean;
  rotation: number;
  separation: number;
  size: number;
  symbol: CIMSymbol;
  respectFrame: boolean;
  frame?: Frame;
  url?: string;
  anchorPoint?: {
    x: number;
    y: number;
  };
  anchorPointUnits?: string;
  offsetX?: number;
  offsetY?: number;
};

export type CIMSymbol = CIMObject & {
  enabled: boolean;
  symbolLayers?: SymbolLayer[];
};
