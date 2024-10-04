import {WellKnownName} from 'geostyler-style';

type Geometry = {
    rings?: number[][][];
    paths?: number[][][];
    curveRings?: { a?: number[][]; c?: number[][] }[][];
};

export const toWKT = (geometry: Geometry): { wellKnownName: WellKnownName; maxX?: number; maxY?: number } => {
  const defaultMarker = {wellKnownName: 'circle' as WellKnownName};

  if (geometry.rings) {
    let [rings] = geometry.rings;
    rings = heightNormalized(rings);
    let coordinates = rings.map(j => j.join(' ')).join(', ');
    return {
      wellKnownName: `wkt://POLYGON((${coordinates}))` as WellKnownName,
      maxX: Math.max(...rings.map(coord => coord[0])),
      maxY: Math.max(...rings.map(coord => coord[1])),
    };
  }

  const path = geometry?.paths?.[0];
  if (path && path[0][0] === 2 && path[0][1] === 0 && path[1][0] -2 && path[1][1] === 0) {
    return {wellKnownName: 'wkt://MULTILINESTRING((0 2, 0 0))' as WellKnownName};
  }

  if (geometry.curveRings) {
    const [curveRing] = geometry.curveRings;
    const startPoint = curveRing[0];
    const curve = curveRing[1]?.a || curveRing[1]?.c;
    if (!curve) {return defaultMarker;}
    const endPoint = curve[0];
    const centerPoint = curve[1];
    if (endPoint !== startPoint) {return defaultMarker;}
    const radius = distanceBetweenPoints(startPoint as number[], centerPoint);
    return {
      wellKnownName: 'circle' as WellKnownName,
      maxX: radius,
      maxY: radius,
    };
  }

  return defaultMarker;
};

const heightNormalized = (coords: number[][]): number[][] => {
  const height = Math.max(...coords.map(coord => coord[1])) - Math.min(...coords.map(coord => coord[1]));
  return coords.map(coord => [coord[0] / height, coord[1] / height]);
};

const distanceBetweenPoints = (a: number[], b: number[]): number => {
  return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
};
