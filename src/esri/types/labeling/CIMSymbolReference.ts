import { CIMSymbol } from "../symbols";

type CIMPrimitiveOverride = {};
type CIMScaleDependentSizeVariation = {};

/**
 * Represents a symbol reference.
 *
 */
export type CIMSymbolReference = {
    /**
     * Gets or sets the primitive overrides. Typically set by renderers at draw time.
     */
    primitiveOverrides?: CIMPrimitiveOverride[] | null;
    /**
     * Gets or sets the style path. Reserved for future use.
     */
    stylePath?: null | string;
    /**
     * Gets or sets the symbol.
     */
    symbol?: null | CIMSymbol;
    /**
     * Gets or sets the symbol name.
     */
    symbolName?: null | string;
    /**
     * Gets or sets the minimum scale range the symbol reference should be displayed at.
     */
    minScale?: number;
    /**
     * Gets or sets the maximum scale range the symbol reference should be displayed at.
     */
    maxScale?: number;
    /**
     * Gets or sets an array of scale dependent sizes.
     */
    scaleDependentSizeVariation?: CIMScaleDependentSizeVariation[] | null;
    /**
     * Gets or sets the minimum distance at which symbols are visible. Objects closer than this don't get rendered.
     */
    minDistance?: number;
    /**
     * Gets or sets the maximum distance at which symbols are visible. Objects beyond this point don't get rendered.
     */
    maxDistance?: number;
  }