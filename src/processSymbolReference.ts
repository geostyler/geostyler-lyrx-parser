import { Options } from "./types.ts";
import { processSymbolLayer } from "./processSymbolLayer.ts";
import { Symbolizer } from "geostyler-style";
import { CIMSymbolReference } from "./esri/types/labeling/CIMSymbolReference.ts";

export const processSymbolReference = (
  symbolref: CIMSymbolReference,
  options: Options,
): Symbolizer[] => {
  const symbol = symbolref.symbol;
  const symbolizers: Symbolizer[] = [];
  if (!symbol || !symbol.symbolLayers) {
    return symbolizers;
  }
  // Drawing order for geostyler is inverse of rule order.
  const layers = symbol.symbolLayers.slice().reverse();
  layers.forEach((layer) => {
    // Skip not enabled layers.
    if (!layer.enable) {
      return;
    }

    const processedSymbolLayers = processSymbolLayer(layer, symbol, options);
    if (processedSymbolLayers) symbolizers.push(...processedSymbolLayers);
  });
  return symbolizers;
};
