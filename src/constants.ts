export const ESRI_SYMBOLS_FONT: string = "ESRI Default Marker";
export const POLYGON_FILL_RESIZE_FACTOR: number = 2 / 3;
export const SCALE_FACTOR: number = 3 / 2;
export const ESRI_SPECIAL_FONT: string[] = [
  "ttf://ESRI SDS 2.00",
  "ttf://ESRI SDS 1.95",
];
export const ESRI_SPECIAL_FONT_RESIZE_FACTOR: number = 1.8;

export enum MarkerPlacementPosition {
  START = "startPoint",
  END = "endPoint",
}

export enum MarkerPlacementAngle {
  START = "startAngle",
  END = "endAngle",
}

export const ptToPx = (pt: number): number => {
  return pt * (4 / 3);
};
