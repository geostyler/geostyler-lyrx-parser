import {CIMObject} from '../CIMObject.ts';
import {CIMSymbolReference} from '../labeling';


export type Class = {
    alternateSymbols: CIMSymbolReference[];
    label: string;
    filter: string;
    symbol: CIMSymbolReference;
    minValue?: number;
    maxValue?: number;
    breakCount?: number;
    breakValues?: number[];
    breakLabels?: string[];
    breakSymbols?: CIMSymbolReference[];
    values: {
        type: string;
        fieldValues: string[];
    }[];
};

export type Group = {
    classes: Class[];
};

export type VisualVariable = CIMObject & {
    rotationTypeZ: string;
    visualVariableInfoZ: {
       expression: string;
       valueExpressionInfo: {
           expression: string;
       };
   };
};

export type CIMRenderer = CIMObject & {
    visualVariables?: VisualVariable[];
};
