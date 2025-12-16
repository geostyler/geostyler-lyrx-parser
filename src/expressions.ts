import { LabelExpressionEngine } from "./esri/types/index.ts";
import {
  CombinationFilter,
  ComparisonOperator,
  Filter,
  Fproperty,
  GeoStylerNumberFunction,
  GeoStylerStringFunction,
  GeoStylerFunction,
} from "geostyler-style";
import { WARNINGS } from "./toGeostylerUtils.ts";

export const fieldToFProperty = (
  field: string,
  toLowerCase: boolean,
): Fproperty => {
  return {
    args: [toLowerCase ? field.toLowerCase() : field],
    name: "property",
  };
};

export const andFilter = (filters: Filter[]): CombinationFilter => {
  return ["&&", ...filters];
};

export const orFilter = (conditions: Filter[]): CombinationFilter => {
  return ["||", ...conditions];
};

export const equalFilter = (
  name: string,
  val: string,
  toLowerCase: boolean,
): Filter => {
  return getSimpleFilter("==", name, val, toLowerCase);
};

export const getSimpleFilter = (
  operator: ComparisonOperator,
  value1: string,
  value2: string,
  toLowerCase = true,
): Filter => {
  return [
    operator,
    stringToParameter(value1, toLowerCase),
    stringToParameter(value2, false),
  ];
};

export const convertExpression = (
  rawExpression: string,
  engine: LabelExpressionEngine,
  toLowerCase: boolean,
): string | GeoStylerStringFunction => {
  let expression: string = rawExpression;
  if (engine === LabelExpressionEngine.Arcade) {
    expression = convertArcadeExpression(rawExpression);
  }
  if (toLowerCase) {
    expression = expression.toLowerCase();
  }

  // Handle if-then-else expressions.
  const regex = /\[\s*if\s*\(([^)]+)\)\s*{([^}]*)}\s*\]/si;
  const match = expression.match(regex);
  if (match) {
    const condition = match[1];
    const thenPart = match[2];
    const elsePart = match.length === 4 ? convertArcadeExpression(match[3]) : "";

    const booleanFunction = processGeostylerBooleanFunction(condition, toLowerCase);
    if (booleanFunction) {
      const processedThen = convertExpression(thenPart, engine, toLowerCase);
      return {
        name: "if_then_else",
        args: [booleanFunction, processedThen, elsePart]
      } as unknown as GeoStylerStringFunction;
    }
    return processPropertyName(expression);
  }

  // Match expressions like "Round($feature.CONTOUR, 0)"
  if (/round\s*\(.*\)/i.test(expression)) {
    return processRoundExpression(expression, toLowerCase, "");
  }

  if (expression.includes("+") || expression.includes("&")) {
    const tokens = expression.includes("+")
      ? expression.split("+")
      : expression.split("&");
    const parsedExpression = tokens.map((token) => {
      token = token.trimStart().trimEnd();
      if (token.includes("[")) {
        return processPropertyName(token);
      } else {
        const literal = token.replaceAll('"', "");
        return replaceSpecialLiteral(literal);
      }
    });
    return parsedExpression.join("");
  }
  return processPropertyName(expression);
};

export const convertWhereClause = (
  clause: string,
  toLowerCase: boolean,
): Filter => {
  clause = clause.replace("(", "").replace(")", "");
  if (clause.includes(" AND ")) {
    const subexpressions = clause.split(" AND ").map((s) => s.trim());
    return andFilter(
      subexpressions.map((s) => convertWhereClause(s, toLowerCase)),
    );
  }
  if (clause.includes("=")) {
    const tokens = clause.split("=").map((t) => t.trim());
    return getSimpleFilter("==", tokens[0], tokens[1], toLowerCase);
  }
  if (clause.includes("<>")) {
    const tokens = clause.split("<>").map((t) => t.trim());
    return getSimpleFilter("!=", tokens[0], tokens[1], toLowerCase);
  }
  if (clause.includes(">")) {
    const tokens = clause.split(">").map((t) => t.trim());
    return getSimpleFilter(">", tokens[0], tokens[1], toLowerCase);
  }
  if (clause.toLowerCase().includes(" in ")) {
    clause = clause.replace(" IN ", " in ");
    const tokens = clause.split(" in ");
    const attribute = tokens[0];
    let values: string[] = [];
    if (tokens[1].startsWith("() ")) {
      values = tokens[1].substring(3).split(",");
    }
    const subexpressions: Filter[] = [];
    values.forEach((value) => {
      subexpressions.push(
        getSimpleFilter(
          "==",
          `${stringToParameter(attribute, toLowerCase)}`,
          `${stringToParameter(value, toLowerCase)}`,
        ),
      );
    });
    if (values.length === 1) {
      return subexpressions[0];
    }
    let accum: Filter = orFilter([subexpressions[0], subexpressions[1]]);
    for (let subexpression of subexpressions.slice(2)) {
      accum = orFilter([accum, subexpression]);
    }
    return accum;
  }
  WARNINGS.push(
    `Clause skipped because it is not supported as filter: ${clause}}`,
  );
  return ["==", 0, 0];
};

export const processRotationExpression = (
  expression: string,
  rotationType: string,
  toLowerCase: boolean,
): GeoStylerNumberFunction | null => {
  const field = expression.includes("$feature")
    ? convertArcadeExpression(expression)
    : processPropertyName(expression);
  const fProperty: Fproperty = fieldToFProperty(field, toLowerCase);
  if (rotationType === "Arithmetic") {
    return { args: [fProperty, -1], name: "mul" };
  } else if (rotationType === "Geographic") {
    return { args: [fProperty, 90], name: "sub" };
  }
  return null;
};

export const processRoundExpression = (
  expression: string,
  toLowerCase: boolean,
  language: string,
): GeoStylerStringFunction | string => {
  // Match expressions like "Round($feature.CONTOUR, 0)" and processes the field and decimal places
  const match = expression.match(/(?:{{\s*)?round\(\s*(\w+)\s*,\s*(\d+)\s*\)\s*(?:}})?/);
  if (match) {
    const field = match[1];
    const decimalPlaces = Number(match[2]);
    const fProperty: Fproperty = fieldToFProperty(field, toLowerCase);
    let decimalFormat: string;
    if (decimalPlaces === 0) {
      decimalFormat = '#';
    } else {
      decimalFormat = '#.' + '#'.repeat(decimalPlaces);
    }
    return {
      args: [decimalFormat, fProperty, language],
      name: "numberFormat"
    };
  }
  return expression;
};

export const processGeostylerBooleanFunction = (
  expression: string,
  toLowerCase: boolean
): GeoStylerFunction | null => {
  const whereClause = convertWhereClause(expression, toLowerCase);
  if (Array.isArray(whereClause) && whereClause.length === 3) {
    const fProperty: Fproperty = fieldToFProperty(
      String(whereClause[1]),
      toLowerCase
    );
    const value = Number(whereClause[2]);
    if (whereClause[0] === ">") {
      return {
        name: "greaterThan",
        args: [fProperty, value]
      };
    } 

    if (whereClause[0] === "==") {
      return {
        name: "equalTo",
        args: [fProperty, value]
      };
    }
    
    if (whereClause[0] === "<") {
      return {
        name: "lessThan",
        args: [fProperty, value]
      };
    }
    
    if (whereClause[0] === "!=") {
      return {
        name: "notEqualTo",
        args: [fProperty, value]
      };
    }
  }
  return null;
};

const replaceSpecialLiteral = (literal: string): string => {
  if (literal === "vbnewline") {
    return "/n";
  }
  return literal;
};

const processPropertyName = (token: string): string => {
  return token.replace("[", "{{").replace("]", "}}").trim();
};

const convertArcadeExpression = (expression: string): string => {
  expression = expression.replaceAll("$feature.", "");
  return `[${expression}]`;
};

const stringToParameter = (s: string, toLowerCase: boolean): string | null => {
  if (
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith('"') && s.endsWith('"'))
  ) {
    // Removes quote around and returns.
    return s.substring(1).substring(0, s.length - 2);
  }
  if (s === "<Null>") {
    return null;
  }
  // Lowercase if it's wanted and (first letter) alphabetical then alphanumerical.
  if (toLowerCase && s.match(/^[A-zÀ-ú_-][[A-zÀ-ú0-9-_]*$/)) {
    s = s.toLowerCase();
  }
  // Returns as is.
  return s;
};
