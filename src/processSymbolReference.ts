import { Options } from "./types.ts";
import { processSymbolLayer } from "./processSymbolLayer.ts";
import { Symbolizer } from "geostyler-style";
import { CIMSymbolReference } from "./esri/types/labeling/CIMSymbolReference.ts";

export const processSymbolReference = async (
  symbolref: CIMSymbolReference,
  options: Options,
  outerSize?: number,
): Promise<Symbolizer[]> => {
  const symbol = symbolref.symbol;
  const symbolizers: Symbolizer[] = [];
  if (!symbol || !symbol.symbolLayers) {
    return symbolizers;
  }
  // Drawing order for geostyler is inverse of rule order.
  const layers = symbol.symbolLayers.slice().reverse();
  for await (const layer of layers) {
    // Skip not enabled layers.
    if (!layer.enable) {
      continue;
    }

    const processedSymbolLayers = await processSymbolLayer(
      layer,
      symbol,
      options,
      outerSize,
    );
    if (processedSymbolLayers) symbolizers.push(...processedSymbolLayers);
  }
  return symbolizers;
};
