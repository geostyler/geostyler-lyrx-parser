import { CIMColor, CIMColorType } from "./esri/types/symbols";

export const processOpacity = (color: CIMColor | null): number => {
  if (color === null || !color.values) {
    return 0;
  }
  return color.values[color.values.length - 1] / 100;
};

export const processColor = (color: CIMColorType): string => {
  if (color === null) {
    return "#000000";
  }
  let values = color.values ?? [0, 0, 0];
  if (color.type === "CIMRGBColor") {
    return rgbaToHex(values);
  } else if (color.type === "CIMCMYKColor") {
    return rgbaToHex(cmyk2Rgb(values));
  } else if (color.type === "CIMHSVColor") {
    return rgbaToHex(hsv2rgb(values));
  } else if (color.type === "CIMGrayColor") {
    return rgbaToHex(hsv2rgb(values));
  } else {
    return "#000000";
  }
};

const rgbaToHex = (rgba: number[]): string => {
  // eslint-disable-next-line no-bitwise
  const value = (1 << 24) + (rgba[0] << 16) + (rgba[1] << 8) + rgba[2];
  return `#${value.toString(16).slice(1).split(".")[0]}`;
};

const cmyk2Rgb = (cmykArray: number[]): [number, number, number] => {
  let c = cmykArray[0];
  let m = cmykArray[1];
  let y = cmykArray[2];
  let k = cmykArray[3];

  let r = Math.floor(255 * (1 - c / 100) * (1 - k / 100));
  let g = Math.floor(255 * (1 - m / 100) * (1 - k / 100));
  let b = Math.floor(255 * (1 - y / 100) * (1 - k / 100));

  return [r, g, b];
};

const hsv2rgb = (hsvArray: number[]): [number, number, number] => {
  let h = hsvArray[0] / 360;
  let s = hsvArray[1] / 100;
  let v = hsvArray[2] / 100;

  if (s === 0.0) {
    v *= 255;
    return [v, v, v];
  }

  let i = Math.floor(h * 6.0);
  let f = h * 6.0 - i;
  let p = 255 * (v * (1.0 - s));
  let q = 255 * (v * (1.0 - s * f));
  let t = 255 * (v * (1.0 - s * (1.0 - f)));

  v *= 255;

  i %= 6;

  if (i === 0) {
    return [v, t, p];
  }
  if (i === 1) {
    return [q, v, p];
  }
  if (i === 2) {
    return [p, v, t];
  }
  if (i === 3) {
    return [p, q, v];
  }
  if (i === 4) {
    return [t, p, v];
  }
  if (i === 5) {
    return [v, p, q];
  }
  return [-1, -1, -1];
};
