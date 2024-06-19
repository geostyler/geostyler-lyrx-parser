import {WellKnownText} from "./customProperties";

export const convertExpression = (rawExpression: string, engine: string, toLowerCase: boolean) => {
    let expression: any = rawExpression;
    if (engine == "Arcade") {
        expression = convertArcadeExpression(rawExpression);
    }
    if (toLowerCase) {
        expression = rawExpression.toLowerCase();
    }
    if (expression.includes("+") || expression.includes("&")) {
        let tokens: string[] = expression.includes("+") ? expression.split("+").reverse() : expression.split("&").reverse();
        let addends = [];
        for (let token of tokens) {
            if (token.includes("[")) {
                addends.push(["PropertyName", processPropertyName(token)]);
            } else {
                let literal = token.replace('"', "");
                addends.push(replaceSpecialLiteral(literal));
            }
            let allOps: any = addends[0];
            for (let attr of addends.slice(1)) {
                allOps = ["Concatenate", attr, allOps];
            }
            expression = allOps;
        }
    } else {
        expression = ["PropertyName", processPropertyName(expression)];
    }
    return expression;
}


export const convertWhereClause = (clause: string, toLowerCase: boolean): any => {
    clause = clause.replace("(", "").replace(")", "");
    const expression = [];
    if (clause.includes(" AND ")) {
        expression.push("And");
        let subexpressions = clause.split(" AND ").map(s => s.trim());
        expression.push(...subexpressions.map(s => convertWhereClause(s, toLowerCase)));
        return expression;
    }
    if (clause.includes("=")) {
        let tokens = clause.split("=").map(t => t.trim());
        expression.push("PropertyIsEqualTo", stringToParameter(tokens[0], toLowerCase), stringToParameter(tokens[1], toLowerCase));
        return expression;
    }
    if (clause.includes("<>")) {
        let tokens = clause.split("<>").map(t => t.trim());
        expression.push("PropertyIsNotEqualTo", stringToParameter(tokens[0], toLowerCase), stringToParameter(tokens[1], toLowerCase));
        return expression;
    }
    if (clause.includes(">")) {
        let tokens = clause.split(">").map(t => t.trim());
        expression.push("PropertyIsGreaterThan", stringToParameter(tokens[0], toLowerCase), stringToParameter(tokens[1], toLowerCase));
        return expression;
    }
    if (clause.toLowerCase().includes(" in ")) {
        clause = clause.replace(" IN ", " in ");
        let tokens = clause.split(" in ");
        let attribute = tokens[0];
        let values: string[] = []
        if (tokens[1].startsWith("() ")) {
            values = tokens[1].substring(3).split(",");
        }
        let subexpressions = [];
        for (let v of values) {
            subexpressions.push(["PropertyIsEqualTo", stringToParameter(attribute, toLowerCase), stringToParameter(v, toLowerCase)]);
        }
        if (values.length == 1) {
            return subexpressions[0];
        }

        let accum: any = ["Or", subexpressions[0], subexpressions[1]];
        for (let subexpression of subexpressions.slice(2)) {
            accum = ["Or", accum, subexpression];
        }
        return accum;
    }
    return clause;
}

export const processRotationExpression = (expression: string, rotationType: string, toLowerCase: boolean): [string, string[], number] | null => {
    let field = expression.includes("$feature") ? convertArcadeExpression(expression) : processPropertyName(expression);
    let propertyNameExpression = ["PropertyName", toLowerCase ? field.toLowerCase() : field];
    if (rotationType == "Arithmetic") {
        return ["Mul", propertyNameExpression, -1];
    } else if (rotationType == "Geographic") {
        return ["Sub", propertyNameExpression, 90];
    }
    return null;
}

const replaceSpecialLiteral = (literal: string): string => {
    if (literal == "vbnewline") {
        return WellKnownText.NewLine;
    }
    return literal;
}

const processPropertyName = (token: string): string => {
    return token.replace("[", "").replace("]", "").trim();
}

const convertArcadeExpression = (expression: string): string => {
    return expression.replace("$feature.", "");
}

const stringToParameter = (s: string, toLowerCase: boolean): string | string[] => {
    s = s.trim();
    if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
        // Removes quote around and returns.
        return s.substring(1).substring(0, s.length -2);
    }
    // Returns if it's alphabetical only.
    if (s.match(/^[A-Z]*$/i)) {
        if (toLowerCase) {
            s = s.toLowerCase();
        }
        return ["PropertyName", s];
    }
    // Returns as is.
    return s;
}