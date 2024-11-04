import {CIMRenderer, Group} from './CIMRenderer.ts';
import {CIMSymbolReference} from '../labeling';

export type CIMUniqueValueRenderer = CIMRenderer & {
    defaultSymbol?: CIMSymbolReference;
    fields?: string[];
    groups?: Group[];
};
