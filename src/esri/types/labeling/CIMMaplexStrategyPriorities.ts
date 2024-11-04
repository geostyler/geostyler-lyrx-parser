import { CIMObject } from "../CIMObject.ts";

/**
 * Represents Maplex strategy priorities.
 *
 */
export type CIMMaplexStrategyPriorities = CIMObject & {
  /**
   * Gets or sets the priority for stacking.
   */
  stacking?: number;
  /**
   * Gets or sets the priority for overrun.
   */
  overrun?: number;
  /**
   * Gets or sets the priority for font compression.
   */
  fontCompression?: number;
  /**
   * Gets or sets the priority for font reduction.
   */
  fontReduction?: number;
  /**
   * Gets or sets the priority for abbreviation.
   */
  abbreviation?: number;
};
