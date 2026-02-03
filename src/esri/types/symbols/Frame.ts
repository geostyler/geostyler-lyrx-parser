/**
 * Represents a frame with coordinate boundaries.
 * Used to define the spatial extent of a symbol or marker.
 * This is a property of CIMVectorMarker, not a standalone CIM type.
 */
export type Frame = {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
};

/**
 * Calculates the width of a frame.
 */
export const getFrameWidth = (frame: Frame): number => {
  return Math.abs(frame.xmax - frame.xmin);
};

/**
 * Calculates the height of a frame.
 */
export const getFrameHeight = (frame: Frame): number => {
  return Math.abs(frame.ymax - frame.ymin);
};

/**
 * Calculates the maximum dimension (width or height) of a frame.
 */
export const getFrameMax = (frame: Frame): number => {
  return Math.max(getFrameWidth(frame), getFrameHeight(frame));
};
