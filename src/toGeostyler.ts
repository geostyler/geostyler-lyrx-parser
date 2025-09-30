import {
  Filter,
  GeoStylerNumberFunction,
  Rule,
  Style,
  Symbolizer,
} from "geostyler-style";
import {
  andFilter,
  convertExpression,
  convertWhereClause,
  equalFilter,
  fieldToFProperty,
  orFilter,
  processRotationExpression,
} from "./expressions.ts";
import { Options } from "./types.ts";
import {
  extractFillColor,
  extractFontWeight,
  ptToPxProp,
  WARNINGS,
} from "./toGeostylerUtils.ts";
import { processSymbolReference } from "./processSymbolReference.ts";
import {
  CIMFeatureLayer,
  CIMLabelClass,
  CIMLayerDefinition,
  CIMLayerDocument,
  CIMRasterLayer,
  CIMRenderer,
  CIMUniqueValueRenderer,
  Group,
  LabelExpressionEngine,
  LabelFeatureType,
} from "./esri/types/index.ts";
import { CIMTextSymbol } from "./esri/types/symbols/index.ts";
import { CIMBreaksRenderer } from "./esri/types/renderers/CIMBreaksRenderer.ts";
import { CIMSimpleRenderer } from "./esri/types/renderers/CIMSimpleRenderer.ts";
import { CIMMaplexRotationProperties } from "./esri/types/labeling/CIMMaplexRotationProperties.ts";

const usedIcons: string[] = [];

export const convert = (
  layerDocument: CIMLayerDocument,
  options: Options = {},
): [Style, string[], string[]] => {
  const geoStyler = processLayer(layerDocument?.layerDefinitions?.[0], options);
  return [geoStyler, usedIcons, WARNINGS];
};

const processLayer = (layer: CIMLayerDefinition, options: Options): Style => {
  const style: Style = {
    name: layer.name,
    rules: [],
  };

  options = {
    ...{ toLowerCase: true, replaceesri: false },
    ...options,
  };

  if (layer.type === "CIMFeatureLayer") {
    style.rules = processFeatureLayer(layer as CIMFeatureLayer, options);
  } else if (layer.type === "CIMRasterLayer") {
    style.rules = processRasterLayer(layer as CIMRasterLayer);
  }

  return style;
};

const processFeatureLayer = (
  layer: CIMFeatureLayer,
  options: Options = {},
): Rule[] => {
  const toLowerCase = !!options.toLowerCase;
  const renderer = layer.renderer;
  if (!renderer) {
    WARNINGS.push(`No renderer on layer: ${layer.name}`);
    return [];
  }
  const rules = processRenderer(renderer, options);

  if (layer.labelVisibility) {
    for (const labelClass of layer.labelClasses || []) {
      rules.push(processLabelClass(labelClass, toLowerCase));
    }
  }

  const rotation = getSymbolRotationFromVisualVariables(renderer, toLowerCase);
  if (rotation) {
    rules.forEach((rule) => {
      assignRotation(rotation, rule.symbolizers);
    });
  }
  return rules;
};

const processRenderer = (renderer: CIMRenderer, options: Options): Rule[] => {
  const rules: Rule[] = [];
  // CIMSimpleRenderer
  if (renderer.type === "CIMSimpleRenderer") {
    rules.push(processSimpleRenderer(renderer as CIMSimpleRenderer, options));
    return rules;
  }
  // CIMUniqueValueRenderer
  if (renderer.type === "CIMUniqueValueRenderer") {
    const uvRenderer = renderer as CIMUniqueValueRenderer;
    if (uvRenderer.groups) {
      uvRenderer.groups.forEach((group) => {
        rules.push(
          ...processUniqueValueGroup(uvRenderer.fields!, group, options),
        );
      });
    } else if (uvRenderer.defaultSymbol) {
      // This is really a simple renderer
      const rule: Rule = {
        name: "",
        symbolizers: processSymbolReference(uvRenderer.defaultSymbol, options),
      };
      rules.push(rule);
    }
    return rules;
  }
  // CIMClassBreaksRenderer
  if (renderer.type === "CIMClassBreaksRenderer") {
    const breaksRenderer = renderer as CIMBreaksRenderer;
    if (
      ["GraduatedColor", "GraduatedSymbol"].includes(
        breaksRenderer.classBreakType,
      )
    ) {
      rules.push(...processClassBreaksRenderer(breaksRenderer, options));
      return rules;
    }
  }
  WARNINGS.push(`Unsupported renderer type: ${renderer}`);
  return rules;
};

const processRasterLayer = (_layer: CIMRasterLayer): [] => {
  WARNINGS.push("CIMRasterLayer are not supported yet.");
  // const rules = [{ name: layer.name, symbolizers: [rasterSymbolizer(layer)] }];
  // geostyler.rules = rules;
  return [];
};

const assignRotation = (
  rotation: GeoStylerNumberFunction,
  symbolizers: Symbolizer[],
) => {
  symbolizers
    .filter(
      (symbolizer) =>
        symbolizer.kind === "Text" ||
        symbolizer.kind === "Icon" ||
        symbolizer.kind === "Mark",
    )
    .forEach((symbolizer) => {
      symbolizer.rotate = rotation;
    });
};

const processClassBreaksRenderer = (
  renderer: CIMBreaksRenderer,
  options: Options = {},
): Rule[] => {
  const rules: Rule[] = [];
  const symbolsAscending: Symbolizer[][] = [];
  const field = renderer.field;
  let lastbound: number | null = null;
  const toLowerCase = !!options.toLowerCase;
  const rotation = getSymbolRotationFromVisualVariables(renderer, toLowerCase);

  const rendererBreaks = renderer.breaks || [];
  rendererBreaks.forEach((rBreak) => {
    const symbolizers = processSymbolReference(rBreak.symbol, options);
    const upperbound = rBreak.upperBound || 0;

    let filter: Filter;
    if (lastbound !== null) {
      filter = [
        "&&",
        [">", toLowerCase ? field.toLowerCase() : field, lastbound],
        ["<=", toLowerCase ? field.toLowerCase() : field, upperbound],
      ];
    } else {
      filter = ["<=", toLowerCase ? field.toLowerCase() : field, upperbound];
    }
    lastbound = upperbound;

    if (rotation) {
      assignRotation(rotation, symbolizers);
    }

    const ruleDef: Rule = {
      filter,
      symbolizers,
      name: rBreak.label || "classbreak",
    };

    symbolsAscending.push(symbolizers);
    rules.push(ruleDef);
  });

  if (!renderer.showInAscendingOrder) {
    rules.reverse();
    for (const [index, rule] of rules.entries()) {
      rule.symbolizers = symbolsAscending[index];
    }
  }

  return rules;
};

const processLabelClass = (
  labelClass: CIMLabelClass,
  toLowerCase: boolean,
): Rule => {
  // TODO ConvertTextSymbol:
  if (labelClass.textSymbol?.symbol?.type !== "CIMTextSymbol") {
    return { name: "", symbolizers: [] };
  }

  const textSymbol = labelClass.textSymbol?.symbol as CIMTextSymbol;
  const expression = convertExpression(
    labelClass?.expression ?? "",
    labelClass.expressionEngine ?? LabelExpressionEngine.Arcade,
    toLowerCase,
  );
  const fontFamily = textSymbol?.fontFamilyName || "Arial";
  const fontSize = ptToPxProp(textSymbol, "height", 12, true);

  const color = extractFillColor(textSymbol?.symbol?.symbolLayers ?? []);
  const fontWeight = extractFontWeight(textSymbol);
  const rotationProps =
    labelClass.maplexLabelPlacementProperties?.rotationProperties ||
    ({} as CIMMaplexRotationProperties);
  const rotationField = rotationProps.rotationField;

  const symbolizer: Symbolizer = {
    kind: "Text",
    anchor: "right",
    rotate: 0.0,
    color: color,
    font: [fontFamily],
    label: expression,
    size: fontSize,
    fontWeight: fontWeight,
  };

  const stdProperties = labelClass.standardLabelPlacementProperties;
  const stdPlacementType = stdProperties?.featureType;
  const stdPointPlacementType = stdProperties?.pointPlacementMethod;
  const maplexProperties = labelClass.maplexLabelPlacementProperties;
  const maplexPlacementType = maplexProperties?.featureType;
  const maplexPrimaryOffset = ptToPxProp(
    maplexProperties ?? {},
    "primaryOffset",
    0,
  );
  const maplexPointPlacementMethod = maplexProperties?.pointPlacementMethod;

  if (
    stdPlacementType === LabelFeatureType.Line &&
    maplexPlacementType === LabelFeatureType.Line
  ) {
    symbolizer.placement = "line";
    const primaryOffset = maplexPrimaryOffset ?? ptToPxProp(textSymbol, "primaryOffset", 0);
    symbolizer.perpendicularOffset = primaryOffset !== 0 ? primaryOffset + fontSize / 2 : 0;
  } else if (
    maplexPlacementType === LabelFeatureType.Point &&
    maplexPointPlacementMethod === "AroundPoint"
  ) {
    const offset = maplexPrimaryOffset + fontSize / 2;
    symbolizer.offset = [offset, offset * -1];
  } else if (
    stdPlacementType === LabelFeatureType.Point &&
    stdPointPlacementType === "AroundPoint"
  ) {
    const offset = maplexPrimaryOffset + fontSize / 2;
    symbolizer.offset = [offset, offset * -1];
  } else {
    symbolizer.offset = [0, 0];
  }

  if (rotationField) {
    const fProperty = fieldToFProperty(rotationField, toLowerCase);
    symbolizer.rotate = { args: [fProperty, -1], name: "mul" };
  } else {
    symbolizer.rotate = 0;
  }

  const haloSize = ptToPxProp(textSymbol, "haloSize", 0);
  if (haloSize && textSymbol.haloSymbol) {
    const haloColor = extractFillColor(
      textSymbol?.haloSymbol?.symbolLayers ?? [],
    );
    Object.assign(symbolizer, {
      haloColor: haloColor,
      haloWidth: haloSize,
      haloOpacity: 1,
    });
  }

  // @ts-ignore FIXME see issue #67
  // Grouping labels if thinDuplicateLabels is true, or in case of polygons, if numLabelsOption is OneLabelPerName
  symbolizer.group =
    labelClass.maplexLabelPlacementProperties?.thinDuplicateLabels ||
    (maplexPlacementType === LabelFeatureType.Polygon &&
      labelClass.standardLabelPlacementProperties?.numLabelsOption ===
        "OneLabelPerName");

  const rule: Rule = { name: "", symbolizers: [symbolizer] };

  const scaleDenominator = processScaleDenominator(
    labelClass.minimumScale,
    labelClass.maximumScale,
  );
  if (scaleDenominator) {
    rule.scaleDenominator = scaleDenominator;
  }

  if (labelClass.whereClause) {
    rule.filter = convertWhereClause(labelClass.whereClause, toLowerCase);
  }

  return rule;
};

const processSimpleRenderer = (
  renderer: CIMSimpleRenderer,
  options: Options,
): Rule => {
  return {
    name: renderer.label || "",
    symbolizers: processSymbolReference(renderer.symbol, options),
  };
};

const processUniqueValueGroup = (
  fields: string[],
  group: Group,
  options: Options,
): Rule[] => {
  const toLowerCase = options.toLowerCase || false;
  const rules: Rule[] = [];
  group.classes = group.classes || [];
  group.classes.forEach((oneClass) => {
    const name = oneClass.label || "label";
    const values = oneClass.values;
    const conditions: Filter[] = [];

    values
      .filter((value) => "fieldValues" in value)
      .forEach((value) => {
        const fieldValues = value.fieldValues;
        let condition = equalFilter(fields[0], fieldValues[0], toLowerCase);
        for (const [fieldValue, fieldName] of fieldValues
          .slice(1)
          .map((fv: unknown, idx: number) => [fv, fields[idx + 1]])) {
          condition = andFilter([
            condition,
            equalFilter(`${fieldName}`, `${fieldValue}`, toLowerCase),
          ]);
        }
        conditions.push(condition);
      });

    let ruleFilter: Filter | null = null;
    if (conditions.length) {
      ruleFilter =
        conditions.length === 1 ? conditions[0] : orFilter(conditions);
      const rule: Rule = {
        name,
        filter: ruleFilter,
        symbolizers: processSymbolReference(oneClass.symbol, options),
      };
      const scaleDenominator = processScaleDenominator(
        oneClass.symbol.minScale,
        oneClass.symbol.maxScale,
      );
      if (scaleDenominator) {
        rule.scaleDenominator = scaleDenominator;
      }
      rules.push(rule);
    }
    const alternateSymbols = oneClass.alternateSymbols || [];
    alternateSymbols.forEach((symbolRef) => {
      const altRule: Rule = {
        name,
        symbolizers: processSymbolReference(symbolRef, options),
      };
      if (ruleFilter) {
        altRule.filter = ruleFilter;
      }
      const scaleDenominator = processScaleDenominator(
        symbolRef.minScale,
        symbolRef.maxScale,
      );
      if (scaleDenominator) {
        altRule.scaleDenominator = scaleDenominator;
      }
      rules.push(altRule);
    });
  });

  return rules;
};

const getSymbolRotationFromVisualVariables = (
  renderer: CIMRenderer | null,
  toLowerCase: boolean,
): GeoStylerNumberFunction | null => {
  const visualVariables = renderer?.visualVariables ?? [];
  visualVariables.find((visualVariable) => {
    if (visualVariable.type !== "CIMRotationVisualVariable") {
      return false;
    }
    const expression =
      visualVariable.visualVariableInfoZ?.valueExpressionInfo?.expression ||
      visualVariable.visualVariableInfoZ?.expression;
    const rotationType = visualVariable.rotationTypeZ;
    return processRotationExpression(expression, rotationType, toLowerCase);
  });
  return null;
};

const processScaleDenominator = (
  minimumScale?: number,
  maximumScale?: number,
): { [key: string]: number } | null => {
  if (minimumScale === undefined && maximumScale === undefined) {
    return null;
  }
  const scaleDenominator: { [key: string]: number } = {};
  if (minimumScale !== undefined) {
    scaleDenominator.max = minimumScale;
  }
  if (maximumScale !== undefined) {
    scaleDenominator.min = maximumScale;
  }
  return scaleDenominator;
};
