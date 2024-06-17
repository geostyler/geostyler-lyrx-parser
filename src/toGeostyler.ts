// import { writeFileSync, existsSync, mkdirSync } from 'fs';
// import uuid from 'uuid';
// import { tmpdir } from 'os';
// import path from 'path';
import { Style, Rule as FIXMERULE } from 'geostyler-style';
import {
    OFFSET_FACTOR,
    ESRI_SYMBOLS_FONT,
    POLYGON_FILL_RESIZE_FACTOR,
    ptToPx,
    MarkerPlacementPosition, MarkerPlacementAngle
} from './constants';
import { toWKT } from "./wktGeometries.ts";
import {convertExpression, convertWhereClause, processRotationExpression} from "./expressions.ts";

type MarkerPlacement = Record<string, any>;
type Stroke = Record<string, any>;
type Fill = Record<string, any>;
type Marker = Record<string, any>;

interface Layer {
    name: string;
    type: string;
    renderer?: Renderer;
    labelVisibility?: boolean;
    labelClasses?: LabelClass[];
    [key: string]: any;
}

interface Renderer {
    type: string;
    fields?: string[];
    groups?: Group[];
    defaultSymbol?: SymbolReference;
    classBreakType?: string;
    [key: string]: any;
}

interface Group {
    [key: string]: any;
}

interface SymbolReference {
    [key: string]: any;
}

interface LabelClass {
    [key: string]: any;
}

interface Options {
    toLowerCase?: boolean;
    [key: string]: any;
}

interface Rule {
    name: string;
    symbolizers?: Symbolizer[];
    scaleDenominator?: any;
    filter?: any[]|any;
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

interface LabelClass {
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

interface Options {
    toLowerCase?: boolean;
}

interface Symbolizer {
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

const usedIcons: string[] = []
const warnings: string[] = []

export const convert = (arcgis:any , options=undefined): any => {
  const geoStyler = processLayer(arcgis["layerDefinitions"][0], options);
  return [geoStyler, usedIcons, warnings]
}

const processLayer = (layer: Layer, options: Options = {}): Style => {
    const toLowerCase = options.toLowerCase || false;
    const style: Style = {
        name: layer.name,
        rules: []
    };

    if (layer.type === "CIMFeatureLayer") {
        const renderer = layer.renderer!;
        const rules: Rule[] = [];

        if (renderer.type === "CIMSimpleRenderer") {
            rules.push(processSimpleRenderer(renderer, options));
        } else if (renderer.type === "CIMUniqueValueRenderer") {
            if (renderer.groups) {
                for (const group of renderer.groups) {
                    rules.push(...processUniqueValueGroup(renderer.fields!, group, options));
                }
            } else if (renderer.defaultSymbol) {
                // This is really a simple renderer
                const rule: Rule = {
                    name: "",
                    symbolizers: processSymbolReference(renderer.defaultSymbol, options),
                };
                rules.push(rule);
            }
        } else if (
            renderer.type === "CIMClassBreaksRenderer" &&
            ["GraduatedColor", "GraduatedSymbol"].includes(renderer.classBreakType!)
        ) {
            rules.push(...processClassBreaksRenderer(renderer, options));
        } else {
            warnings.push(`Unsupported renderer type: ${renderer}`);
            return style;
        }

        if (layer.labelVisibility) {
            for (const labelClass of layer.labelClasses || []) {
                rules.push(processLabelClass(labelClass, toLowerCase));
            }
        }

        const rotation = getSymbolRotationFromVisualVariables(renderer, toLowerCase);
        if (rotation) {
            for (const rule of rules) {
                for (const symbolizer of rule.symbolizers ?? []) {
                    symbolizer.rotate = rotation;
                }
            }
        }

        style.rules = rules as FIXMERULE[];
    } else if (layer.type === "CIMRasterLayer") {
        warnings.push("CIMRasterLayer are not supported yet.");
        // const rules = [{ name: layer.name, symbolizers: [rasterSymbolizer(layer)] }];
        // geostyler.rules = rules;
    }

    return style;
}

const processClassBreaksRenderer = (renderer: Renderer, options: Options = {}): Rule[] => {
  const rules: Rule[] = [];
  const symbolsAscending: Symbolizer[][] = [];
  const field = renderer.field;
  let lastbound: number | null = null;
  const toLowerCase = options.toLowerCase || false;
  const rotation = getSymbolRotationFromVisualVariables(renderer, toLowerCase);

  for (const classbreak of renderer.breaks || []) {
    const symbolizers = processSymbolReference(classbreak.symbol, options);
    const upperbound = classbreak.upperBound || 0;

    let filt: any[];
    if (lastbound !== null) {
      filt = [
        "And",
        [
          "PropertyIsGreaterThan",
          ["PropertyName", toLowerCase ? field.toLowerCase() : field],
          lastbound,
        ],
        [
          "PropertyIsLessThanOrEqualTo",
          ["PropertyName", toLowerCase ? field.toLowerCase() : field],
          upperbound,
        ],
      ];
    } else {
      filt = [
        "PropertyIsLessThanOrEqualTo",
        ["PropertyName", toLowerCase ? field.toLowerCase() : field],
        upperbound,
      ];
    }
    lastbound = upperbound;

    if (rotation) {
      for (const symbolizer of symbolizers) {
        symbolizer.rotate = rotation;
      }
    }

    const ruledef: Rule = {
      name: classbreak.label || "classbreak",
      symbolizers: symbolizers,
      filter: filt,
    };

    symbolsAscending.push(symbolizers);
    rules.push(ruledef);
  }

  if (!renderer.showInAscendingOrder) {
    rules.reverse();
    for (const [index, rule] of rules.entries()) {
      rule.symbolizers = symbolsAscending[index];
    }
  }

  return rules;
}

const processLabelClass = (labelClass: LabelClass, toLowerCase: boolean = false): Rule => {
  const textSymbol = labelClass.textSymbol.symbol;
  const expression = convertExpression(labelClass.expression, labelClass.expressionEngine, toLowerCase);
  const fontFamily = textSymbol.fontFamilyName || "Arial";
  const fontSize = ptToPxProp(textSymbol, "height", 12, true);
  const color = extractFillColor(textSymbol.symbol.symbolLayers);
  const fontWeight = extractFontWeight(textSymbol);
  const rotationProps = labelClass.maplexLabelPlacementProperties?.rotationProperties || {};
  const rotationField = rotationProps.rotationField;

  const symbolizer: Symbolizer = {
    kind: "Text",
    anchor: "right",
    rotate: 0.0,
    color: color,
    font: fontFamily,
    label: expression,
    size: fontSize,
    weight: fontWeight,
  };

  const stdProperties = labelClass.standardLabelPlacementProperties || {};
  const stdPlacementType = stdProperties.featureType;
  const stdPointPlacementType = stdProperties.pointPlacementMethod;
  const maplexProperties = labelClass.maplexLabelPlacementProperties || {};
  const maplexPlacementType = maplexProperties.featureType;
  const maplexPrimaryOffset = ptToPxProp(maplexProperties, "primaryOffset", 0);
  const maplexPointPlacementMethod = maplexProperties.pointPlacementMethod;

  if (stdPlacementType === "Line" && maplexPlacementType === "Line") {
    const primaryOffset = ptToPxProp(textSymbol, "primaryOffset", 0);
    symbolizer.perpendicularOffset = primaryOffset + fontSize;
  } else if (maplexPlacementType === "Point" && maplexPointPlacementMethod === "AroundPoint") {
    const offset = maplexPrimaryOffset + fontSize / 2;
    symbolizer.offset = [offset, offset];
    symbolizer.anchorPointX = symbolizer.anchorPointY = 0.0;
  } else if (stdPlacementType === "Point" && stdPointPlacementType === "AroundPoint") {
    const offset = maplexPrimaryOffset + fontSize / 2;
    symbolizer.offset = [offset, offset];
    symbolizer.anchorPointX = symbolizer.anchorPointY = 0.0;
  } else {
    symbolizer.offset = [0.0, 0.0];
  }

  if (rotationField) {
    symbolizer.rotate = [
      "Mul",
      ["PropertyName", toLowerCase ? rotationField.toLowerCase() : rotationField],
      -1,
    ];
  } else {
    symbolizer.rotate = 0.0;
  }

  const haloSize = ptToPxProp(textSymbol, "haloSize", 0);
  if (haloSize && textSymbol.haloSymbol) {
    const haloColor = extractFillColor(textSymbol.haloSymbol.symbolLayers);
    Object.assign(symbolizer, {
      haloColor: haloColor,
      haloSize: haloSize,
      haloOpacity: 1,
    });
  }

  symbolizer.group = labelClass.maplexLabelPlacementProperties?.thinDuplicateLabels || (
    maplexPlacementType === "Polygon" &&
    labelClass.standardLabelPlacementProperties?.numLabelsOption === "OneLabelPerName"
  );

  const rule: Rule = { name: "", symbolizers: [symbolizer] };

  const scaleDenominator = processScaleDenominator(labelClass.minimumScale, labelClass.maximumScale);
  if (scaleDenominator) {
    rule.scaleDenominator = scaleDenominator;
  }

  if (labelClass.whereClause) {
    rule.filter = convertWhereClause(labelClass.whereClause, toLowerCase);
  }

  return rule;
}

const processSimpleRenderer = (renderer: Renderer, options: Options): Rule => {
  return {
    name: renderer.label || "",
    symbolizers: processSymbolReference(renderer.symbol, options),
  };
}

const processUniqueValueGroup = (fields: string[], group: Group, options: Options): Rule[] =>{
  const toLowerCase = options.toLowerCase || false;

  const _and = (a: any[], b: any[]): any[] => {
    return ["And", a, b];
  };

  const _or = (listConditions: any[]): any[] => {
    const orConditions = listConditions;
    orConditions.unshift("Or");
    return orConditions;
  };

  const _equal = (name: string, val: any): any[] => {
    if (val === "<Null>") {
      return ["PropertyIsNull", ["PropertyName", toLowerCase ? name.toLowerCase() : name]];
    }
    return ["PropertyIsEqualTo", ["PropertyName", toLowerCase ? name.toLowerCase() : name], val];
  };

  const rules: Rule[] = [];
  for (const clazz of group.classes || []) {
    const rule: Rule = { name: clazz.label || "label" };
    const values = clazz.values;
    const conditions: any[] = [];
    let ruleFilter: any[] | null = null;

    for (const v of values) {
      if ("fieldValues" in v) {
        const fieldValues = v.fieldValues!;
        let condition = _equal(fields[0], fieldValues[0]);
        for (const [fieldValue, fieldName] of fieldValues.slice(1).map((fv: unknown, idx: number) => [fv, fields[idx + 1]])) {
          condition = _and(condition, _equal(fieldName, fieldValue));
        }
        conditions.push(condition);
      }
    }

    if (conditions.length) {
      ruleFilter = conditions.length === 1 ? conditions[0] : _or(conditions);
      rule.filter = ruleFilter;
      rule.symbolizers = processSymbolReference(clazz.symbol, options);

      const scaleDenominator = processScaleDenominator(clazz.symbol.minScale, clazz.symbol.maxScale);
      if (scaleDenominator) {
        rule.scaleDenominator = scaleDenominator;
      }
      rules.push(rule);
    }

    for (const symbolRef of clazz.alternateSymbols || []) {
      const altRule: Rule = { name: rule.name };
      if (ruleFilter) {
        altRule.filter = ruleFilter;
      }
      altRule.symbolizers = processSymbolReference(symbolRef, options);

      const scaleDenominator = processScaleDenominator(symbolRef.minScale, symbolRef.maxScale);
      if (scaleDenominator) {
        altRule.scaleDenominator = scaleDenominator;
      }
      rules.push(altRule);
    }
  }

  return rules;
}

const processSymbolReference = (symbolref: SymbolReference, options: Options): Symbolizer[] => {
  const symbol = symbolref.symbol;
  const symbolizers: Symbolizer[] = [];
  if (!symbol.symbolLayers) {
    return symbolizers;
  }

  for (const layer of symbol.symbolLayers.slice().reverse()) { // drawing order for geostyler is inverse of rule order
    if (!layer.enable) {
      continue;
    }
    let symbolizer = processSymbolLayer(layer, symbol.type, options);
    if (!symbolizer) {
      continue;
    }
    if (["CIMVectorMarker", "CIMPictureFill", "CIMCharacterMarker"].includes(layer.type)) {
      if (symbol.type === "CIMLineSymbol") {
        if (layer.type === "CIMCharacterMarker") {
          if (orientedMarkerAtStartOfLine(layer.markerPlacement)) {
            symbolizer = processOrientedMarkerAtEndOfLine(layer, 'start', options);
            symbolizers.push(symbolizer);
          }
          if (orientedMarkerAtEndOfLine(layer.markerPlacement)) {
            symbolizer = processOrientedMarkerAtEndOfLine(layer, 'end', options);
            symbolizers.push(symbolizer);
          }
          continue;
        } else {
          symbolizer = formatLineSymbolizer(symbolizer);
        }
      } else if (symbol.type === "CIMPolygonSymbol") {
        const markerPlacement = layer.markerPlacement || {};
        symbolizer = formatPolygonSymbolizer(symbolizer, markerPlacement);
      }
    }
    symbolizers.push(symbolizer);
  }

  return symbolizers;
}

const formatLineSymbolizer = (symbolizer: Symbolizer): Symbolizer => {
    return {
        "kind": "Line",
        "opacity": 1.0,
        "perpendicularOffset": 0.0,
        "graphicStroke": [symbolizer],
        "graphicStrokeInterval": ptToPxProp(symbolizer, "size", 0) * 2, // TODO
        "graphicStrokeOffset": 0.0,
        "Z": 0,
    }
}

const formatPolygonSymbolizer = (symbolizer: Symbolizer, markerPlacement: MarkerPlacement): Symbolizer | null  => {
    const markerPlacementType = markerPlacement.get("type")
    if (markerPlacementType == "CIMMarkerPlacementInsidePolygon") {
        const margin = processMarkerPlacementInsidePolygon(symbolizer, markerPlacement)
        return {
            kind: "Fill",
            opacity: 1.0,
            perpendicularOffset: 0.0,
            graphicFill: [symbolizer],
            graphicFillMargin: margin,
            Z: 0,
        }
    }
    if (markerPlacementType == "CIMMarkerPlacementAlongLineSameSize") {
        return {
            kind: "Line",
            opacity: 1.0,
            size: ptToPxProp(symbolizer, "size", 10),
            perpendicularOffset: ptToPxProp(symbolizer, "perpendicularOffset", 0.0),
            graphicStroke: [symbolizer],
            Z: 0,
        }
    }
    return null;
}

const processOrientedMarkerAtEndOfLine = (
    layer: Record<string, any>,
    orientedMarker: string,
    options: Record<string, any>
): Record<string, any> | undefined => {
  let markerPositionFnc: string, markerRotationFnc: string, rotation: number;

  if (orientedMarker == "start") {
    markerPositionFnc = MarkerPlacementPosition.START;
    markerRotationFnc = MarkerPlacementAngle.START;
    rotation = layer?.rotation ?? 180;
  } else if (orientedMarker === "end") {
    markerPositionFnc = MarkerPlacementPosition.END;
    markerRotationFnc = MarkerPlacementAngle.END;
    rotation = layer?.rotation ?? 0;
  } else {
    return undefined;
  }

  const replaceesri = options?.replaceesri ?? false;
  const fontFamily = layer["fontFamilyName"];
  const charindex = layer["characterIndex"];
  const hexcode = charindex.toString(16);

  let name;
  if (fontFamily === ESRI_SYMBOLS_FONT && replaceesri) {
    name = esriFontToStandardSymbols(charindex);
  } else {
    name = `ttf://${fontFamily}#${hexcode}`;
  }

  let symbolLayers, fillColor, fillOpacity, strokeColor, strokeWidth, strokeOpacity;

  try {
    symbolLayers = layer["symbol"]["symbolLayers"];
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

  return {
    "opacity": 1.0,
    "fillOpacity": fillOpacity,
    "strokeColor": strokeColor,
    "strokeOpacity": strokeOpacity,
    "strokeWidth": strokeWidth,
    "rotate": ["Add", [markerRotationFnc, ["PropertyName", "shape"]], rotation],
    "kind": "Mark",
    "color": fillColor,
    "wellKnownName": name,
    "size": ptToPxProp(layer, "size", 10),
    "Z": 0,
    "Geometry": [markerPositionFnc, ["PropertyName", "shape"]],
    "inclusion": "mapOnly",
  };
}

const processMarkerPlacementInsidePolygon = (
    symbolizer: Record<string, any>,
    markerPlacement: Record<string, any>
): number[] => {
    let resizeFactor = symbolizer?.wellKnownName?.startsWith("wkt://POLYGON") ? 1 : POLYGON_FILL_RESIZE_FACTOR;

    let size = Math.round((symbolizer?.size ?? 0) * resizeFactor) || 1;
    symbolizer["size"] = size;

    let maxX = size / 2, maxY = size / 2;
    if (symbolizer?.maxX && symbolizer?.maxY) {
        maxX = Math.floor((symbolizer.maxX * resizeFactor)) || 1;
        maxY = Math.floor((symbolizer.maxY * resizeFactor)) || 1;
    }

    let stepX = ptToPxProp(markerPlacement, "stepX", 0);
    let stepY = ptToPxProp(markerPlacement, "stepY", 0);

    if (stepX < maxX) {
        stepX += maxX * 2;
    }

    if (stepY < maxY) {
        stepY += maxY * 2;
    }

    let offsetX = ptToPxProp(markerPlacement, "offsetX", 0);
    let offsetY = ptToPxProp(markerPlacement, "offsetY", 0);

    let right = Math.round(stepX / 2 - maxX - offsetX);
    let left = Math.round(stepX / 2 - maxX + offsetX);
    let top = Math.round(stepY / 2 - maxY - offsetY);
    let bottom = Math.round(stepY / 2 - maxY + offsetY);

    return [top, right, bottom, left];
};

const extractEffect = (layer: Record<string, any>): Record<string, any> => {
    let effects: Record<string, any> = {};
    if ("effects" in layer) {
        layer.effects.forEach((effect: any) => {
            effects = {...effects, ...processEffect(effect)};
        });
    }
    return effects;
};

const processEffect = (effect: Record<string, any>): Record<string, any> => {
    let ptToPxAndCeil = (v: number) => {
        return Math.ceil(ptToPx(v))
    };

    if (effect.type === "CIMGeometricEffectDashes") {
        let dasharrayValues = effect.dashTemplate?.map(ptToPxAndCeil) || [];
        if (dasharrayValues.length > 1) {
            return {
                "dasharrayValues": dasharrayValues,
                "dasharray": dasharrayValues.join(" "),
            };
        }
    }
    else if (effect.type === "CIMGeometricEffectOffset") {
        return {
            "offset": ptToPxAndCeil(effect.offset || 0) * -1,
        };
    }
    return {};
};

const getStraightHatchMarker = ():any => {
    return ["shape://horline", "shape://vertline"]
}


const getTiltedHatchMarker = ():any => {
    return ["shape://slash", "shape://backslash"]
}

const hatchMarkerForAngle = (angle: number): any => {
    const straightHatchMarkers = getStraightHatchMarker();
    const tiltedHatchMarkers = getTiltedHatchMarker();
    const quadrant = Math.floor(((angle + 22.5) % 180) / 45.0);

    return [
        straightHatchMarkers[0],
        tiltedHatchMarkers[0],
        straightHatchMarkers[1],
        tiltedHatchMarkers[1],
    ][quadrant];
};

const esriFontToStandardSymbols = (charIndex: number): string => {
    const mapping: {[index: number]: string} = {
        33: "circle",
        34: "square",
        35: "triangle",
        40: "circle",
        41: "square",
        42: "triangle",
        94: "star",
        95: "star",
        203: "cross",
        204: "cross",
    };

    if (mapping.hasOwnProperty(charIndex)) {
        return mapping[charIndex];
    } else {
        warnings.push(`Unsupported symbol from ESRI font (character index ${charIndex}) replaced by default marker`);
        return "circle";
    }
};

const processSymbolLayer = (layer: any, symboltype: any, options?: any) => {
    let layerType: string = layer["type"];
    switch (layerType) {
        case "CIMSolidStroke":
            return processSymbolSolidStroke(layer, symboltype);
        case "CIMSolidFill":
            return processSymbolSolidFill(layer);
        case "CIMCharacterMarker":
            return processSymbolCharacterMarker(layer, options);
        case "CIMVectorMarker":
            return processSymbolVectorMarker(layer);
        case "CIMHatchFill":
            return processSymbolHatchFill(layer);
        case "CIMPictureFill":
        case "CIMPictureMarker":
            return processSymbolPicture(layer);
        default:
            return;
    }
}

const processSymbolSolidStroke = (symboltype: any, layer: any) => {
    let effects = extractEffect(layer);
    if (symboltype === "CIMPolygonSymbol") {
        let stroke: Stroke = {
            "kind": "Fill",
            "outlineColor": processColor(layer["color"]),
            "outlineOpacity": processOpacity(layer["color"]),
            "outlineWidth": ptToPxProp(layer, "width", 0),
        }
        if ("dasharray" in effects) {
            stroke["outlineDasharray"] = effects["dasharray"];
        }
        return stroke;
    } else {
        let stroke: Stroke = {
            "kind": "Line",
            "color": processColor(layer["color"]),
            "opacity": processOpacity(layer["color"]),
            "width": ptToPxProp(layer, "width", 0),
            "perpendicularOffset": 0,
            "cap": layer["capStyle"].toLowerCase(),
            "join": layer["joinStyle"].toLowerCase(),
        }
        if ("dasharray" in effects) {
            stroke["dasharray"] = effects["dasharray"];
        }
        if ("offset" in effects) {
            stroke["perpendicularOffset"] = effects["offset"];
        }
        return stroke;
    }
}

const processSymbolSolidFill = (layer: any): any => {
    let color = layer.color;
    if(color !== undefined) {
        return {
            kind: "Fill",
            opacity: processOpacity(color),
            color: processColor(color),
            fillOpacity: 1.0,
        };
    }
}

const processSymbolCharacterMarker = (layer: any, options: { [key: string]: any } ): { [key: string]: any } => {
    let replaceesri = options.replaceesri === undefined ? false : options.replaceesri;
    let fontFamily = layer.fontFamilyName;
    let charindex = layer.characterIndex;
    let hexcode = charindex.toString(16);
    let size = ptToPxProp(layer, "size", 12);

    let name: string;
    if(fontFamily === ESRI_SYMBOLS_FONT && replaceesri){
        name = esriFontToStandardSymbols(charindex);
    }
    else {
        name = `ttf://${fontFamily}#${hexcode}`;
    }

    let rotate = layer.rotation === undefined ? 0 : layer.rotation;
    let rotateClockwise = layer.rotateClockwise === undefined ? false : layer.rotateClockwise;
    if(!rotateClockwise){
        rotate *= -1;
    }

    let fillColor: string;
    let fillOpacity: number;
    let strokeColor: string;
    let strokeWidth: number;
    let strokeOpacity: number;
    try {
        let symbolLayers = layer.symbol.symbolLayers;
        fillColor = extractFillColor(symbolLayers);
        fillOpacity = extractFillOpacity(symbolLayers);
        [strokeColor, strokeWidth, strokeOpacity] = extractStroke(symbolLayers);
    }
    catch(e) {
        fillColor = "#000000";
        fillOpacity = 1.0;
        strokeOpacity = 0;
        strokeColor = "#000000";
        strokeWidth = 0.0;
    }

    return {
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
        size: size,
        Z: 0,
    };
}

const processSymbolVectorMarker = (layer: Layer): Marker => {
    if(layer.size){
        layer.size = ptToPxProp(layer, "size", 3);
    }
    // Default values
    let fillColor = "#ff0000";
    let strokeColor = "#000000";
    let strokeWidth = 1.0;
    let markerSize = 10;
    let strokeOpacity = 1;
    let wellKnownName = "circle";
    let maxX: number | null = null;
    let maxY: number | null = null;

    let markerGraphics = layer.markerGraphics !== undefined ? layer.markerGraphics : [];
    if(markerGraphics.length > 0){
        // TODO: support multiple marker graphics
        let markerGraphic = markerGraphics[0];
        let marker = processSymbolReference(markerGraphic, {})[0];
        let sublayers = markerGraphic.symbol.symbolLayers.filter((sublayer: any) => sublayer.enable);
        fillColor = extractFillColor(sublayers);
        [strokeColor, strokeWidth, strokeOpacity] = extractStroke(sublayers);
        markerSize = marker.size !== undefined ? marker.size : (layer.size !== undefined ? layer.size : 10);
        if(markerGraphic.symbol.type === "CIMPointSymbol") {
            wellKnownName = marker.wellKnownName ?? '';
        }
        else if(["CIMLineSymbol", "CIMPolygonSymbol"].includes(markerGraphic.symbol.type)){
            let shape = toWKT(markerGraphic.geometry !== undefined ? markerGraphic.geometry : undefined);
            wellKnownName = shape.wellKnownName;
            maxX = ptToPxProp(shape, "maxX", 0);
            maxY = ptToPxProp(shape, "maxY", 0);
        }
    }

    let marker: Marker = {
        opacity: 1.0,
        rotate: 0.0,
        kind: "Mark",
        color: fillColor,
        wellKnownName: wellKnownName,
        size: markerSize,
        strokeColor: strokeColor,
        strokeWidth: strokeWidth,
        strokeOpacity: strokeOpacity,
        fillOpacity: 1.0,
        Z: 0,
    };
    if(maxX !== null){
        marker["maxX"] = maxX;
    }
    if(maxY !== null){
        marker["maxY"] = maxY;
    }

    let markerPlacement = layer.markerPlacement != undefined && layer.markerPlacement.placementTemplate !== undefined ? layer.markerPlacement.placementTemplate : undefined;
    // Conversion of dash arrays is made on a case-by-case basis
    if(JSON.stringify(markerPlacement) === JSON.stringify([12, 3])){
        marker["outlineDasharray"] = "4 0 4 7";
        marker["size"] = 6;
        marker["perpendicularOffset"] = -3.5;
    }
    else if(JSON.stringify(markerPlacement) === JSON.stringify([15])){
        marker["outlineDasharray"] = "0 5 9 1";
        marker["size"] = 10;
    }

    return marker;
}

 const processSymbolHatchFill = (layer: Layer): { [key: string]: any } => {
    let rotation = layer.rotation || 0;
    let symbolLayers = layer.lineSymbol.symbolLayers;
    let [color, width, opacity] = extractStroke(symbolLayers);

    // Use symbol and not rotation because rotation crops the line.
    let wellKnowName = hatchMarkerForAngle(rotation);
    if(rotation % 45){
        warnings.push("Rotation value different than a multiple of 45° is not possible. The nearest value is taken instead.");
    }

    // Geoserver acts weird with tilted lines. Empirically, that's the best result so far:
    // Takes the double of the raw separation value. Line and dash lines are treated equally and are looking good.
    let rawSeparation = layer.separation || 0;
    let separation = getStraightHatchMarker().includes(wellKnowName) ? ptToPx(rawSeparation) : rawSeparation * 2;

    let fill: Fill = {
        kind: "Fill",
        opacity: 1.0,
        graphicFill: [
            {
                kind: "Mark",
                color: color,
                wellKnownName: wellKnowName,
                size: separation,
                strokeColor: color,
                strokeWidth: width,
                strokeOpacity: opacity,
                rotate: 0, // no rotation, use the symbol.
            }
        ],
        Z: 0,
    };

    let effects = extractEffect(symbolLayers[0]);
    if("dasharray" in effects){
        fill.graphicFill[0].outlineDasharray = effects.dasharray;

        // In case of dash array, the size must be at least as long as the dash pattern sum.
        if(separation > 0){
            const dasharrayValues = effects.dasharrayValues as number[];
            let neededSize = dasharrayValues.reduce((a, b) => a + b, 0); // sum of array elements
            if(getStraightHatchMarker().includes(wellKnowName)){
                // To keep the "original size" given by the separation value, we play with a negative margin.
                let negativeMargin = (neededSize - separation) / 2 * -1;
                if(wellKnowName === getStraightHatchMarker()[0]){
                    fill["graphicFillMargin"] = [negativeMargin, 0, negativeMargin, 0];
                }
                else{
                    fill["graphicFillMargin"] = [0, negativeMargin, 0, negativeMargin];
                }
            }
            else{
                // In case of tilted lines, the trick with the margin is not possible without cropping the pattern.
                neededSize = separation;
                warnings.push("Unable to keep the original size of CIMHatchFill for line with rotation");
            }
            fill.graphicFill[0].size = neededSize;
        }
    }
    return fill;
}

 const processSymbolPicture = (layer: any): { [key: string]: any } => {
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

    let size = ptToPxProp(layer, 'height', ptToPxProp(layer, 'size', 0));
    return {
        opacity: 1.0,
        rotate: 0.0,
        kind: 'Icon',
        color: null,
        // image: url,
        image: 'http://FIXME',
        size: size,
        Z: 0,
    };
}

const getSymbolRotationFromVisualVariables = (renderer: any, toLowerCase: boolean) => {
    const visualVariables = renderer?.visualVariables ?? [];
    for (const visualVariable of visualVariables) {
        if (visualVariable.type === "CIMRotationVisualVariable") {
            const expression = visualVariable.visualVariableInfoZ?.valueExpressionInfo?.expression ||
                visualVariable.visualVariableInfoZ?.expression;
            const rotationType = visualVariable.rotationTypeZ;
            return processRotationExpression(expression, rotationType, toLowerCase);
        }
    }
    return null;
}

const orientedMarkerAtStartOfLine = (markerPlacement: any): boolean => {
    if(markerPlacement?.angleToLine) {
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
}

const orientedMarkerAtEndOfLine = (markerPlacement: MarkerPlacement): boolean => {
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
}


const extractOffset = (symbolLayer: any): null | [number, number] => {
    let offsetX = ptToPxProp(symbolLayer, "offsetX", 0) * OFFSET_FACTOR;
    let offsetY = ptToPxProp(symbolLayer, "offsetY", 0) * OFFSET_FACTOR * -1;

    if(offsetX === 0 && offsetY !== 0) {
        return null;
    }
    return [offsetX, offsetY];
}

const extractStroke = (symbolLayers: any[]): [string, number, number] => {
    for (let sl of symbolLayers) {
        if (sl.type === "CIMSolidStroke") {
            let color = processColor(sl.color ?? "");
            let width = ptToPxProp(sl, "width", 0);
            let opacity = processOpacity(sl.color ?? "");
            return [color, width, opacity];
        }
    }
    return ["#000000", 0, 0];
}

const extractFillColor = (symbolLayers: any[]): string => {
    let color: string = "#ffffff";
    for (let sl of symbolLayers) {
        if (sl.type === "CIMSolidFill") {
            color = processColor(sl.color ?? "");
        } else if (sl.type === "CIMCharacterMarker") {
            color = extractFillColor(sl.symbol.symbolLayers);
        }
    }
    return color;
}

const extractFillOpacity = (symbolLayers: any[]): number => {
    for (let sl of symbolLayers) {
        if (sl.type === "CIMSolidFill") {
            return processOpacity(sl.color);
        }
    }
    return 1.0;
}

const extractFontWeight = (textSymbol: any): string => {
    return textSymbol.fontStyleName === "Bold" ? "bold" : "normal";
}

const processOpacity = (color: { values: number[] } | null): number => {
    if(color === null) {
        return 0;
    }
    return color.values[color.values.length - 1] / 100;
}

const processColor = (color: any): string => {
    if(color === null) {
        return "#000000";
    }
    let values = color.values;

    if(color.type === "CIMRGBColor") {
        return `#${values[0].toString(16)}${values[1].toString(16)}${values[2].toString(16)}`;
    }
    else if(color.type === "CIMCMYKColor") {
        let [r, g, b] = cmyk2Rgb(values);
        return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
    }
    else if(color.type === "CIMHSVColor") {
        let [r, g, b] = hsv2rgb(values);
        return `#${Math.floor(r).toString(16)}${Math.floor(g).toString(16)}${Math.floor(b).toString(16)}`;
    }
    else if(color.type === "CIMGrayColor") {
        return `#${Math.floor(values[0]).toString(16)}${Math.floor(values[0]).toString(16)}${Math.floor(values[0]).toString(16)}`;
    }
    else {
        return "#000000";
    }
}

const cmyk2Rgb = (cmykArray: number[]): [number, number, number] => {
    let c = cmykArray[0];
    let m = cmykArray[1];
    let y = cmykArray[2];
    let k = cmykArray[3];

    let r = Math.floor(255 * (1 - c / 100) * (1 - k / 100));
    let g = Math.floor(255 * (1 - m / 100) * (1 - k / 100));
    let b = Math.floor(255 * (1 - y / 100) * (1 - k / 100));

    return [r, g, b];
}

const hsv2rgb = (hsvArray: number[]): [number, number, number] => {
    let h = hsvArray[0] / 360;
    let s = hsvArray[1] / 100;
    let v = hsvArray[2] / 100;

    if (s === 0.0) {
        v *= 255;
        return [v, v, v];
    }

    let i = Math.floor(h * 6.0);
    let f = (h * 6.0) - i;
    let p = 255 * (v * (1.0 - s));
    let q = 255 * (v * (1.0 - s * f));
    let t = 255 * (v * (1.0 - s * (1.0 - f)));

    v *= 255

    i %= 6;

    if(i === 0) return [v, t, p];
    if(i === 1) return [q, v, p];
    if(i === 2) return [p, v, t];
    if(i === 3) return [p, q, v];
    if(i === 4) return [t, p, v];
    if(i === 5) return [v, p, q];
    return [-1, -1, -1];
}

const ptToPxProp = (obj: { [key: string]: any }, prop: string, defaultValue: number, asFloat: boolean = true): number => {
    if(obj[prop] === undefined) {
        return defaultValue;
    }
    let value = ptToPx(parseFloat(obj[prop]));
    return asFloat ? value : Math.round(value);
}

const processScaleDenominator = (minimumScale?: number, maximumScale?: number): { [key: string]: number } => {
    let scaleDenominator: { [key: string]: number } = {};
    if(minimumScale !== undefined) {
        scaleDenominator["max"] = minimumScale;
    }
    if(maximumScale !== undefined) {
        scaleDenominator["min"] = maximumScale;
    }
    return scaleDenominator;
}
