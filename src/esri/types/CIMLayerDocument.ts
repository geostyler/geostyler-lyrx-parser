import { CIMLayerDefinition } from "./layers/CIMLayerDefinition";


export type CIMLayerDocument = {
    name: string;
    layerDefinitions: CIMLayerDefinition[];
}
