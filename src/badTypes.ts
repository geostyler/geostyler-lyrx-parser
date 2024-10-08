import {WellKnownName} from 'geostyler-style';

export type MarkerPlacement = Record<string, any>;
export type Stroke = Record<string, any>;
export type Fill = Record<string, any>;

export interface Options {
    [key: string]: any;
    toLowerCase?: boolean;
}

export interface Rule {
    name: string;
    symbolizers?: Symbolizer[];
    scaleDenominator?: any;
    filter?: any[] | any;
}

export interface Symbolizer {
    kind?: string;
    anchor?: string;
    rotate?: any;
    color?: any;
    font?: string;
    label?: string | string[];
    size?: number;
    weight?: any;
    perpendicularOffset?: number;
    offset?: number[];
    anchorPointX?: number;
    anchorPointY?: number;
    haloColor?: any;
    haloSize?: number;
    haloOpacity?: number;
    group?: boolean;
    wellKnownName?: WellKnownName;
    opacity?: number;
    graphicStroke?: any;
    graphicStrokeInterval?: any;
    graphicStrokeOffset?: any;
    graphicFill?: any;
    graphicFillMargin?: any;
}
