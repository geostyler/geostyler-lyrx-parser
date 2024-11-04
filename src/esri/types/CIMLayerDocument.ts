import { CIMLayerDefinition } from "./layers/CIMLayerDefinition.ts";

export type CIMLayerDocument = {
  name: string;
  layerDefinitions: CIMLayerDefinition[];
};
