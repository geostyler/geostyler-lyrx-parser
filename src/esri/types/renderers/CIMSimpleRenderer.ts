import {CIMRenderer} from './CIMRenderer.ts';
import {CIMSymbolReference} from '../labeling';

export type CIMSimpleRenderer = CIMRenderer & {
    label: string;
    symbol: CIMSymbolReference;
};
