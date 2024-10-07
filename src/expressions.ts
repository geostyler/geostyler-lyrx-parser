import { LabelExpressionEngine } from './esri/types/index.ts';
import {ComparisonOperator, Filter} from 'geostyler-style';

export const getSimpleFilter = (
  operator: ComparisonOperator,
  value1: string, value2: string,
  toLowerCase=true): Filter => {
  return [operator, stringToParameter(value1, toLowerCase), stringToParameter(value2, toLowerCase)];
};

export const convertExpression = (
  rawExpression: string, engine: LabelExpressionEngine,
  toLowerCase: boolean
): string => {
  let expression: string = rawExpression;
  if (engine === LabelExpressionEngine.Arcade) {
    expression = convertArcadeExpression(rawExpression);
  }
  if (toLowerCase) {
    expression = rawExpression.toLowerCase();
  }
  if (expression.includes('+') || expression.includes('&')) {
    const tokens = expression.includes('+') ? expression.split('+') : expression.split('&');
    const parsedExpression = tokens.map((token) => {
      token = token.trimStart().trimEnd();
      if (token.includes('[')) {
        return processPropertyName(token);
      } else {
        const literal = token.replaceAll('"', '');
        return replaceSpecialLiteral(literal);
      }
    });
    return parsedExpression.join('');
  }
  return processPropertyName(expression);
};


export const convertWhereClause = (clause: string, toLowerCase: boolean): any => {
  clause = clause.replace('(', '').replace(')', '');
  const expression = [];
  if (clause.includes(' AND ')) {
    expression.push('And');
    let subexpressions = clause.split(' AND ').map(s => s.trim());
    expression.push(...subexpressions.map(s => convertWhereClause(s, toLowerCase)));
    return expression;
  }
  if (clause.includes('=')) {
    let tokens = clause.split('=').map(t => t.trim());
    return getSimpleFilter('==', tokens[0], tokens[1], toLowerCase);
  }
  if (clause.includes('<>')) {
    let tokens = clause.split('<>').map(t => t.trim());
    return getSimpleFilter('!=', tokens[0], tokens[1], toLowerCase);
  }
  if (clause.includes('>')) {
    let tokens = clause.split('>').map(t => t.trim());
    return getSimpleFilter('>', tokens[0], tokens[1], toLowerCase);
  }
  if (clause.toLowerCase().includes(' in ')) {
    clause = clause.replace(' IN ', ' in ');
    let tokens = clause.split(' in ');
    let attribute = tokens[0];
    let values: string[] = [];
    if (tokens[1].startsWith('() ')) {
      values = tokens[1].substring(3).split(',');
    }
    let subexpressions = [];
    for (let v of values) {
      subexpressions.push([
        'PropertyIsEqualTo',
        stringToParameter(attribute, toLowerCase), stringToParameter(v, toLowerCase)
      ]);
    }
    if (values.length === 1) {
      return subexpressions[0];
    }

    let accum: any = ['Or', subexpressions[0], subexpressions[1]];
    for (let subexpression of subexpressions.slice(2)) {
      accum = ['Or', accum, subexpression];
    }
    return accum;
  }
  return clause;
};

export const processRotationExpression = (
  expression: string,
  rotationType: string,
  toLowerCase: boolean): [string, string[], number] | null => {
  let field = expression.includes('$feature') ? convertArcadeExpression(expression) : processPropertyName(expression);
  let propertyNameExpression = ['PropertyName', toLowerCase ? field.toLowerCase() : field];
  if (rotationType === 'Arithmetic') {
    return ['Mul', propertyNameExpression, -1];
  } else if (rotationType === 'Geographic') {
    return ['Sub', propertyNameExpression, 90];
  }
  return null;
};

const replaceSpecialLiteral = (literal: string): string => {
  if (literal === 'vbnewline') {
    return '/n';
  }
  return literal;
};

const processPropertyName = (token: string): string => {
  return token.replace('[', '{{').replace(']', '}}').trim();
};

const convertArcadeExpression = (expression: string): string => {
  return expression.replace('$feature.', '');
};

const stringToParameter = (s: string, toLowerCase: boolean): string|null => {
  s = s.trim();
  if ((s.startsWith('\'') && s.endsWith('\'')) || (s.startsWith('"') && s.endsWith('"'))) {
    // Removes quote around and returns.
    return s.substring(1).substring(0, s.length -2);
  }
  // Lowercase if it's wanted and alphabetical only.
  if (toLowerCase && s.match(/^[A-Z]*$/i)) {
    s = s.toLowerCase();
  }
  if (s === '<Null>') {
    return null;
  }
  // Returns as is.
  return s;
};
