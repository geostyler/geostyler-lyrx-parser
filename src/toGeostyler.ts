import {Rule as FIXMERULE, Style} from 'geostyler-style';
import {convertExpression, convertWhereClause, processRotationExpression} from "./expressions.ts";
import {Options, Rule, Symbolizer} from "./badTypes.ts";
import {extractFillColor, extractFontWeight, ptToPxProp, WARNINGS,} from "./toGeostylerUtils.ts";
import {processSymbolReference} from "./processSymbolReference.ts";
import { CIMLayerDocument, CIMLayerDefinition, CIMFeatureLayer, LabelFeatureType } from './esri/types';
import { CIMLabelClass, LabelExpressionEngine } from './esri/types/labeling/CIMLabelClass.ts';
import { CIMTextSymbol } from './esri/types/symbols/index.ts';


const usedIcons: string[] = []

export const convert = (layerDocument: CIMLayerDocument , options=undefined): any => {
  const geoStyler = processLayer(layerDocument?.layerDefinitions?.[0], options);
  return [geoStyler, usedIcons, WARNINGS]
}

const processLayer = (layer: CIMLayerDefinition, options: Options = {}): Style => {
  const style: Style = {
    name: layer.name,
    rules: []
  };

  if (layer.type === "CIMFeatureLayer") {
      style.rules = processFeatureLayer(layer, options);
  } else if (layer.type === "CIMRasterLayer") {
      style.rules = processRasterLayer(layer);
  }
  
  return style;
}

const processFeatureLayer = (layer: CIMFeatureLayer, options: Options = {}):FIXMERULE[] => {
    const toLowerCase = options.toLowerCase || false;
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
        WARNINGS.push(`Unsupported renderer type: ${renderer}`);
        return [];
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
    return rules as FIXMERULE[];
}

const processRasterLayer = (_layer: any): FIXMERULE[] => {
    WARNINGS.push("CIMRasterLayer are not supported yet.");
    // const rules = [{ name: layer.name, symbolizers: [rasterSymbolizer(layer)] }];
    // geostyler.rules = rules;
    return [];
}

const processClassBreaksRenderer = (renderer: any, options: Options = {}): Rule[] => {
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

const processLabelClass = (labelClass: CIMLabelClass, toLowerCase: boolean = false): Rule => {

  // todo ConvertTextSymbol:
  if (labelClass.textSymbol?.symbol?.type != "CIMTextSymbol")
    return { name: "", symbolizers: [] };

  const textSymbol = labelClass.textSymbol?.symbol as CIMTextSymbol;
  const expression = convertExpression(labelClass?.expression ?? "", labelClass.expressionEngine ?? LabelExpressionEngine.Arcade, toLowerCase);
  const fontFamily = textSymbol?.fontFamilyName || "Arial";
  const fontSize = ptToPxProp(textSymbol, "height", 12, true);
  const color = extractFillColor(textSymbol?.symbol?.symbolLayers ?? []);
  const fontWeight = extractFontWeight(textSymbol);
  const rotationProps = labelClass.maplexLabelPlacementProperties?.rotationProperties || {};
  const rotationField = rotationProps.rotationField;

  const symbolizer: Symbolizer = {
    kind: "Text",
    anchor: "right",
    rotate: 0.0,
    color: color,
    font: fontFamily,
    label: expression.join('-'), // FIXME
    size: fontSize,
    weight: fontWeight,
  };

  const stdProperties = labelClass.standardLabelPlacementProperties;
  const stdPlacementType = stdProperties?.featureType;
  const stdPointPlacementType = stdProperties?.pointPlacementMethod;
  const maplexProperties = labelClass.maplexLabelPlacementProperties;
  const maplexPlacementType = maplexProperties?.featureType;
  const maplexPrimaryOffset = ptToPxProp(maplexProperties ?? {}, "primaryOffset", 0);
  const maplexPointPlacementMethod = maplexProperties?.pointPlacementMethod;

  if (stdPlacementType === LabelFeatureType.Line && maplexPlacementType === LabelFeatureType.Line) {
    const primaryOffset = ptToPxProp(textSymbol, "primaryOffset", 0);
    symbolizer.perpendicularOffset = primaryOffset + fontSize;
  } else if (maplexPlacementType === LabelFeatureType.Point && maplexPointPlacementMethod === "AroundPoint") {
    const offset = maplexPrimaryOffset + fontSize / 2;
    symbolizer.offset = [offset, offset];
    symbolizer.anchorPointX = symbolizer.anchorPointY = 0.0;
  } else if (stdPlacementType === LabelFeatureType.Point && stdPointPlacementType === "AroundPoint") {
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
    const haloColor = extractFillColor(textSymbol?.haloSymbol?.symbolLayers ?? []);
    Object.assign(symbolizer, {
      haloColor: haloColor,
      haloSize: haloSize,
      haloOpacity: 1,
    });
  }

  symbolizer.group = labelClass.maplexLabelPlacementProperties?.thinDuplicateLabels || (
    maplexPlacementType === LabelFeatureType.Polygon &&
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

const processSimpleRenderer = (renderer: any, options: Options): Rule => {
  return {
    name: renderer.label || "",
    symbolizers: processSymbolReference(renderer.symbol, options),
  };
}

const processUniqueValueGroup = (fields: string[], group: any, options: Options): Rule[] =>{
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

const processScaleDenominator = (minimumScale?: number, maximumScale?: number): { [key: string]: number } => {
    let scaleDenominator: { [key: string]: number } = {};
    if (minimumScale !== undefined) {
        scaleDenominator["max"] = minimumScale;
    }
    if (maximumScale !== undefined) {
        scaleDenominator["min"] = maximumScale;
    }
    return scaleDenominator;
}

