export type MarkerPlacement = Record<string, any>;
export type Stroke = Record<string, any>;
export type Fill = Record<string, any>;
export type Marker = Record<string, any>;

export interface Layer {
    name: string;
    type: string;
    renderer?: Renderer;
    labelVisibility?: boolean;
    labelClasses?: LabelClass[];

    [key: string]: any;
}

export interface Renderer {
    type: string;
    fields?: string[];
    groups?: Group[];
    defaultSymbol?: SymbolReference;
    classBreakType?: string;

    [key: string]: any;
}

export interface Group {
    [key: string]: any;
}

export interface SymbolReference {
    [key: string]: any;
}

export interface Options {
    toLowerCase?: boolean;

    [key: string]: any;
}

export interface Rule {
    name: string;
    symbolizers?: Symbolizer[];
    scaleDenominator?: any;
    filter?: any[] | any;
}

interface TextSymbol {
    symbol: {
        symbolLayers: any[];
    };
    fontFamilyName?: string;
    height?: number;
    haloSize?: number;
    haloSymbol?: {
        symbolLayers: any[];
    };
}

export interface LabelClass {
    textSymbol: {
        symbol: TextSymbol;
    };
    expression: string;
    expressionEngine: string;
    maplexLabelPlacementProperties?: {
        rotationProperties?: {
            rotationField?: string;
        };
        featureType?: string;
        primaryOffset?: number;
        pointPlacementMethod?: string;
        thinDuplicateLabels?: boolean;
    };
    standardLabelPlacementProperties?: {
        featureType?: string;
        pointPlacementMethod?: string;
        numLabelsOption?: string;
    };
    minimumScale?: number;
    maximumScale?: number;
    whereClause?: string;
}

export interface Symbolizer {
    kind?: string;
    anchor?: string;
    rotate?: any;
    color?: any;
    font?: string;
    label?: string;
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
    wellKnownName?: string;
    opacity?: number;
    graphicStroke?: any
    graphicStrokeInterval?: any
    graphicStrokeOffset?: any
    graphicFill?: any
    graphicFillMargin?: any
    Z?: number
}