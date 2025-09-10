import { nodeEnvModules as nem } from "./nodeEnvModules.ts";

/** Split base64 string */
interface Base64ImageInfo {
  data: string;
  extension: string;
}

/**
 * Get the data and extension from a base64 string.
 * @returns The data and extension or undefined if the string is not a base64 string.
 */
export const getBase64Info = (
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
 * From a base64 string, write the image to a temporary file and return the path.
 * It will only work in a node environment.
 * @returns The path to the temporary file or undefined if the string is not a base64
 * string or the environment is not a node environment.
 */
const writeFile = (base64String: string): string | undefined => {
  if (!nem.exp) {
    return undefined;
  }
  if (nem.exp.existsSync(base64String)) {
    return base64String;
  }
  const base64Info = getBase64Info(base64String);
  if (!base64Info) {
    return undefined;
  }
  const tempPath = nem.exp.path.join(
    nem.exp.tmpdir(),
    "geostylerLyrxParser",
    crypto.randomUUID().replace("-", ""),
  );
  const iconName = `${crypto.randomUUID()}.${base64Info.extension}`;
  const iconFile = nem.exp.path.join(tempPath, iconName);
  nem.exp.mkdirSync(tempPath, { recursive: true });
  nem.exp.writeFileSync(iconFile, Buffer.from(base64Info.data, "base64"));
  return iconFile;
};

/**
 * From a base64 string, write the image to a temporary file and return the path.
 * If the string is not a base64 string or if it's not a node environment import doesn't exist,
 * then return the string as is.
 * @returns The path to the temporary file or undefined if the string is not a base64
 * string or the environment is not a node environment.
 */
export const base64ToFile = (base64String?: string): string | undefined => {
  if (!base64String) {
    return undefined;
  }
  if (nem.isNodeEnvironment) {
    return writeFile(base64String);
  }
  // eslint-disable-next-line no-console
  console.error(
    "Not a node environment, cannot write image to file: ",
    base64String,
  );
  return base64String;
};
