import { CIMObject } from "../CIMObject.ts";

/**
 * Represents a layer definition in the ArcGIS Pro JSON style.
 * Each layer is defined as a dictionary-like object that conforms
 * to the ArcGIS Pro JSON format.
 */
export type CIMLayerDefinition = CIMObject & {
  name: string;
};
