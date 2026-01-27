import { WellKnownName } from "geostyler-style";
import { Geometry } from "./esri/types";

type CurveSegment = { a?: number[][]; b?: number[][]; c?: number[][] };

export const toWKT = (
  geometry: Geometry,
): { wellKnownName: WellKnownName; maxX?: number; maxY?: number } => {
  const defaultMarker = { wellKnownName: "circle" as WellKnownName };

  if (geometry.rings) {
    let [rings] = geometry.rings;
    rings = heightNormalized(rings);
    let coordinates = rings.map((j) => j.join(" ")).join(", ");
    return {
      wellKnownName: `wkt://POLYGON((${coordinates}))` as WellKnownName,
      maxX: Math.max(...rings.map((coord) => coord[0])),
      maxY: Math.max(...rings.map((coord) => coord[1])),
    };
  }

  const path = geometry?.paths?.[0];
  if (
    path &&
    path[0][0] === 2 &&
    path[0][1] === 0 &&
    path[1][0] - 2 &&
    path[1][1] === 0
  ) {
    return {
      wellKnownName: "wkt://MULTILINESTRING((0 2, 0 0))" as WellKnownName,
    };
  }

  if (geometry.curveRings) {
    const [curveRing] = geometry.curveRings;
    const startPoint = curveRing[0];

    // Check if it's a simple circle (single arc that closes)
    const firstCurve = curveRing[1];
    if (firstCurve && curveRing.length === 2 && Array.isArray(startPoint)) {
      const curve = firstCurve?.a || firstCurve?.b || firstCurve?.c;
      if (curve) {
        const endPoint = curve[0];
        const centerPoint = curve[1];
        if (JSON.stringify(endPoint) === JSON.stringify(startPoint)) {
          // It's a circle - convert to WKT polygon
          const radius = distanceBetweenPoints(startPoint, centerPoint);
          const circleCoords = approximateCircle(centerPoint, radius, 32);
          const normalizedCoords = heightNormalized(circleCoords);
          const coordinates = normalizedCoords
            .map((j) => j.join(" "))
            .join(", ");
          return {
            wellKnownName: `wkt://POLYGON((${coordinates}))` as WellKnownName,
            // Return the original radius (not normalized) for proper scaling
            maxX: radius,
            maxY: radius,
          };
        }
      }
    }

    // Convert curveRing to polygon coordinates
    const polygonCoords = curveRingToCoordinates(curveRing);
    if (polygonCoords.length > 0) {
      const normalizedCoords = heightNormalized(polygonCoords);
      const coordinates = normalizedCoords.map((j) => j.join(" ")).join(", ");
      return {
        wellKnownName: `wkt://POLYGON((${coordinates}))` as WellKnownName,
        maxX: Math.max(...normalizedCoords.map((coord) => coord[0])),
        maxY: Math.max(...normalizedCoords.map((coord) => coord[1])),
      };
    }

    return defaultMarker;
  }

  return defaultMarker;
};

const heightNormalized = (coords: number[][]): number[][] => {
  const minX = Math.min(...coords.map((coord) => coord[0]));
  const maxX = Math.max(...coords.map((coord) => coord[0]));
  const minY = Math.min(...coords.map((coord) => coord[1]));
  const maxY = Math.max(...coords.map((coord) => coord[1]));
  
  const height = maxY - minY;
  
  // Calculate the center of the bounding box
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Normalize by height and center around (0, 0)
  return coords.map((coord) => [
    (coord[0] - centerX) / height,
    (coord[1] - centerY) / height,
  ]);
};

const distanceBetweenPoints = (a: number[], b: number[]): number => {
  return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
};

const curveRingToCoordinates = (
  curveRing: (number[] | CurveSegment)[],
): number[][] => {
  const coords: number[][] = [];
  const segments = 16; // Number of segments to approximate curves

  for (let i = 0; i < curveRing.length; i++) {
    const segment = curveRing[i];

    // If it's a point coordinate
    if (Array.isArray(segment) && typeof segment[0] === "number") {
      coords.push(segment);
    }
    // If it's a curve object
    else if (
      !Array.isArray(segment) &&
      typeof segment === "object" &&
      segment !== null
    ) {
      const prevPoint = coords[coords.length - 1] || [0, 0];

      // Arc curve (property 'a')
      if (segment.a && Array.isArray(segment.a)) {
        const arc = segment.a;
        const endPoint = arc[0] as number[];
        const centerPoint = arc[1] as number[];

        // Approximate arc with line segments
        const arcCoords = approximateArc(
          prevPoint,
          endPoint,
          centerPoint,
          segments,
        );
        coords.push(...arcCoords);
      }
      // Bezier curve (property 'b')
      else if (segment.b && Array.isArray(segment.b)) {
        const bezier = segment.b;
        const endPoint = bezier[0] as number[];
        const controlPoint1 = bezier[1] as number[];
        const controlPoint2 = bezier[2] as number[];

        // Approximate cubic Bezier with line segments
        const bezierCoords = approximateCubicBezier(
          prevPoint,
          controlPoint1,
          controlPoint2,
          endPoint,
          segments,
        );
        coords.push(...bezierCoords);
      }
      // Circle/ellipse curve (property 'c')
      else if (segment.c && Array.isArray(segment.c)) {
        const arc = segment.c;
        const endPoint = arc[0] as number[];
        const centerPoint = arc[1] as number[];

        // Approximate arc with line segments
        const arcCoords = approximateArc(
          prevPoint,
          endPoint,
          centerPoint,
          segments,
        );
        coords.push(...arcCoords);
      }
    }
  }

  return coords;
};

const approximateCircle = (
  centerPoint: number[],
  radius: number,
  segments: number = 32,
): number[][] => {
  const coords: number[][] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const x = centerPoint[0] + radius * Math.cos(angle);
    const y = centerPoint[1] + radius * Math.sin(angle);
    coords.push([x, y]);
  }
  // Close the ring by adding the first point again
  coords.push(coords[0]);
  return coords;
};

const approximateArc = (
  startPoint: number[],
  endPoint: number[],
  centerPoint: number[],
  segments: number,
): number[][] => {
  const coords: number[][] = [];

  const startAngle = Math.atan2(
    startPoint[1] - centerPoint[1],
    startPoint[0] - centerPoint[0],
  );
  const endAngle = Math.atan2(
    endPoint[1] - centerPoint[1],
    endPoint[0] - centerPoint[0],
  );
  const radius = distanceBetweenPoints(startPoint, centerPoint);

  let angleDiff = endAngle - startAngle;
  // Normalize angle difference
  if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  for (let i = 1; i <= segments; i++) {
    const progress = i / segments;
    const angle = startAngle + angleDiff * progress;
    const x = centerPoint[0] + radius * Math.cos(angle);
    const y = centerPoint[1] + radius * Math.sin(angle);
    coords.push([x, y]);
  }

  return coords;
};

const approximateCubicBezier = (
  p0: number[],
  p1: number[],
  p2: number[],
  p3: number[],
  segments: number,
): number[][] => {
  const coords: number[][] = [];

  for (let i = 1; i <= segments; i++) {
    const param = i / segments;
    const paramSquared = param * param;
    const paramCubed = paramSquared * param;
    const oneMinusParam = 1 - param;
    const oneMinusParamSquared = oneMinusParam * oneMinusParam;
    const oneMinusParamCubed = oneMinusParamSquared * oneMinusParam;

    const x =
      oneMinusParamCubed * p0[0] +
      3 * oneMinusParamSquared * param * p1[0] +
      3 * oneMinusParam * paramSquared * p2[0] +
      paramCubed * p3[0];
    const y =
      oneMinusParamCubed * p0[1] +
      3 * oneMinusParamSquared * param * p1[1] +
      3 * oneMinusParam * paramSquared * p2[1] +
      paramCubed * p3[1];

    coords.push([x, y]);
  }

  return coords;
};
