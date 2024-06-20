import { CIMObject } from "../CIMObject";
import { CIMMaplexLabelPlacementProperties } from "./CIMMaplexLabelPlacementProperties";
import { CIMStandardLabelPlacementProperties } from "./CIMStandardLabelPlacementProperties";
import { CIMSymbolReference } from "./CIMSymbolReference";

type FeaturesToLabel = {};

export enum LabelExpressionEngine {
  VBScript,
  JScript,
  Python,
  Arcade
};
  
  /**
 * Represents a label class which describes how to generate a set of text labels from a group of features in a feature layer.
 *
 */
export type CIMLabelClass = CIMObject & {
  /**
   * Gets or sets the human readable text title that describes the label expression.
   */
  expressionTitle?: null | string;
  /**
   * Gets or sets the label expression.
   */
  expression?: null | string;
  /**
   * Gets or sets the label expression engine (the language the expression is written in).
   */
  expressionEngine?: LabelExpressionEngine;
  /**
   * Gets or sets a parameter indicating which features to label.
   */
  featuresToLabel?: FeaturesToLabel;
  /**
   * Gets or sets the Maplex placement properties which are used when the map uses the Maplex label engine.
   */
  maplexLabelPlacementProperties?: null | CIMMaplexLabelPlacementProperties;
  /**
   * Gets or sets the maximum scale for labeling (set as the denominator of the scale's representative fraction).
   */
  maximumScale?: number;
  /**
   * Gets or sets the minimum scale for labeling (set as the denominator of the scale's representative fraction).
   */
  minimumScale?: number;
  /**
   * Gets or sets the name of the label class.
   */
  name?: null | string;
  /**
   * Gets or sets the priority of the label class.
   */
  priority?: number;
  /**
   * Gets or sets the standard placement properties which are used when the map uses the standard label engine.
   */
  standardLabelPlacementProperties?: null | CIMStandardLabelPlacementProperties;
  /**
   * Gets or sets the text symbol of the label class.
   */
  textSymbol?: null | CIMSymbolReference;
  /**
   * Gets or sets a value indicating whether or not to use coded value domain descriptions when labeling.
   */
  useCodedValue?: boolean;
  /**
   * Gets or sets the SQL where clause of which features to label with this label class.
   */
  whereClause?: null | string;
  /**
   * Gets or sets a value indicating whether this label class is visible.
   */
  visibility?: boolean;
  /**
   * Gets or sets the ID of the label class. This property is only used in the context of annotation.
   */
  id?: number;
}
