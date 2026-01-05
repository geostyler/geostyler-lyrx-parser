import { Jimp } from "jimp";
import { WARNINGS } from "./toGeostylerUtils.ts";

/** Split base64 string */
interface Base64ImageInfo {
  data: string;
  extension: string;
}

type SupportedMimeTypes =
  | "image/bmp"
  | "image/tiff"
  | "image/x-ms-bmp"
  | "image/gif"
  | "image/jpeg"
  | "image/png";

/**
 * Get the data and extension from a base64 string.
 * @returns The data and extension or undefined if the string is not a base64 string.
 */
const getBase64ImageInfo = (
  base64String: string,
): Base64ImageInfo | undefined => {
  const tokens = base64String.split(";");
  if (tokens.length !== 2) {
    return undefined;
  }
  const ext = tokens[0].split("/").pop();
  if (!ext) {
    return undefined;
  }
  return {
    data: tokens[1].substring("base64,".length),
    extension: ext,
  };
};

/**
 * Resize a base64 image to the given size using Jimp.
 * This is needed because the end reader could be not able to resize a base64 image.
 * @returns The resized base64 image or the original base64 image if resizing failed.
 */
export const resizeBase64Image = async (
  base64String: string | undefined,
  size: number,
): Promise<string | undefined> => {
  if (!base64String) {
    return undefined;
  }
  const imageInfo = getBase64ImageInfo(base64String);
  if (!imageInfo) {
    return base64String;
  }
  const mimeType = `image/${imageInfo.extension}` as SupportedMimeTypes;
  const buffer = Buffer.from(imageInfo.data, "base64");
  let resizedBase64Image: string | undefined;
  try {
    const image = await Jimp.read(buffer);
    const resizedImage = image.resize({
      w: Math.floor(size),
      h: Math.floor(size),
    });
    resizedBase64Image = await resizedImage.getBase64(mimeType);
  } catch (e) {
    WARNINGS.push(`Could not resize image: ${e}`);
  }
  if (resizedBase64Image) {
    return resizedBase64Image;
  }
  return base64String;
};
