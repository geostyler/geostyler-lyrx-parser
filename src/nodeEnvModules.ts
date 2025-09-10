/**
 * Loaded node modules and related information.
 */
interface NodeEnvModules {
  isNodeEnvironment: boolean;
  exp?: {
    writeFileSync: (path: string, data: string | Buffer) => void;
    existsSync: (path: string) => boolean;
    mkdirSync: (path: string, options: { recursive: boolean }) => void;
    tmpdir: () => string;
    path: {
      join: (...path: string[]) => string;
    };
  };
}

/**
 * Try to load a module by dynamic import.
 * @returns The loaded module or null if it fails.
 */
const loadModule = async (modulePath: string) => {
  try {
    return await import(modulePath);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return null;
};

/**
 * Default node env modules.
 * Will be filled with the loaded modules when the parser is used in a node environment.
 */
export const nodeEnvModules: NodeEnvModules = {
  isNodeEnvironment: false,
};

/**
 * Try to load the needed node modules for the parser to work in a node environment.
 * @param imagesOutputPath
 */
export const tryLoadNeededNodeEnvModules = async (
  imagesOutputPath?: string,
) => {
  const { tmpdir } = await loadModule("os");
  if (!tmpdir) {
    return;
  }
  const { default: path } = await loadModule("path");
  const { writeFileSync, existsSync, mkdirSync } = await loadModule("fs");
  nodeEnvModules.isNodeEnvironment = true;
  nodeEnvModules.exp = {
    writeFileSync,
    existsSync,
    mkdirSync,
    tmpdir,
    path,
  };
};
