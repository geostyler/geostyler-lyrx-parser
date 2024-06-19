import { CIMObject } from "../CIMObject";

type Group = {};
type SymbolReference = {};

export type CIMRenderer = CIMObject & {
    type: string;
    fields?: string[];
    groups?: Group[];
    defaultSymbol?: SymbolReference;
    classBreakType?: string;
}