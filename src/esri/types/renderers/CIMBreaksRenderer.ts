import { CIMRenderer, Group } from "./CIMRenderer.ts";
import { CIMSymbolReference } from "../labeling";

export type CIMBreaksRenderer = CIMRenderer & {
  classBreakType: string;
  defaultSymbol?: CIMSymbolReference;
  field: string;
  groups?: Group[];
  showInAscendingOrder: boolean;
  breaks: {
    type: string;
    fieldValues: string[];
    label: string;
    symbol: CIMSymbolReference;
    upperBound: number;
  }[];
};
