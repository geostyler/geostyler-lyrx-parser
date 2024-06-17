export const ESRI_SYMBOLS_FONT: string = "ESRI Default Marker";
export const POLYGON_FILL_RESIZE_FACTOR: number = 2 / 3;
export const OFFSET_FACTOR: number = 4 / 3;

export enum MarkerPlacementPosition {
    START = "startPoint",
    END = "endPoint"
}

export enum MarkerPlacementAngle {
    START = "startAngle",
    END = "endAngle"
}

export const ptToPx = (pt: number): number => {
    const PT_TO_PX_FACTOR: number = 4 / 3;
    return pt * PT_TO_PX_FACTOR;
}