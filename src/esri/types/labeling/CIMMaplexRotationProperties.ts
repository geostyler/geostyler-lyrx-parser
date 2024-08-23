import { CIMObject } from '../CIMObject';
import {
  MaplexLabelRotationType,
  MaplexRotationAlignmentType,
  CIMExpressionInfo
} from './CIMMaplexLabelPlacementProperties';

/**
 * Represents Maplex rotation properties.
 *
 */
export type CIMMaplexRotationProperties = CIMObject & {
  /**
   * Gets or sets a value indicating whether to enable rotation.
   */
  enable?: boolean;
  /**
   * Gets or sets the rotation type.
   */
  rotationType?: MaplexLabelRotationType;
  /**
   * Gets or sets the rotation field to get values from.
   */
  rotationField?: null | string;
  /**
   * Gets or sets a value indicating whether to place the label perpendicular to the angle.
   */
  perpendicularToAngle?: boolean;
  /**
   * Gets or sets a value indicating whether to align the label to the angle.
   */
  alignLabelToAngle?: boolean;
  /**
   * Gets or sets the alignment type.
   */
  alignmentType?: MaplexRotationAlignmentType;
  /**
   * Gets or sets additional angle to add to the data value.
   */
  additionalAngle?: number;
  /**
   * Gets or sets ExpressionInfo that contains the Arcade expression that returns rotation as a number.
   *  When both RotationField and RotationExpressionInfo are present RotationExpressionInfo is used.
   */
  rotationExpressionInfo?: null | CIMExpressionInfo;
};
