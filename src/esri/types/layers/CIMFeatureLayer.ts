import { CIMLayerAction } from "../CIMLayerAction.ts";
import { CIMLayerDefinition } from "./CIMLayerDefinition.ts";
import { CIMLabelClass } from "../labeling/CIMLabelClass.ts";
import { CIMSymbolReference } from "../labeling/CIMSymbolReference.ts";
import { CIMRenderer } from "../renderers";

type CIMDataConnection = {};
type CIMSymbolLayerMasking = {};
type CIMFeatureExtrusion = {};
type CIMSymbolLayerDrawing = {};
type CIMFeatureReduction = {};
type CIMEditingTemplate = {};
type CIMFeatureTable = {};
type CIMHtmlPopupFormat = {};
type CIMColor = {};
type CIMPageDefinition = {};
type FeatureCacheType = {};
type CIMDisplayFilter = {};
type DisplayFilterType = {};
type CIMLayerElevationSurface = {};
type CIMExpressionInfo = {};
type BlendingMode = {};
type CIM3DLayerProperties = {};
type MapLayerType = {};
type DisplayCacheType = {};
type CIMLayerTemplate = {};
type CIMPopupInfo = {};
type CIMChart = {};
type EsriTimeUnits = {};
type CIMStringMap = {};

export type CIMFeatureLayer = CIMLayerDefinition & {
  /**
   * Gets or sets the layer actions.
   */
  actions?: CIMLayerAction[] | null;
  /**
   * Gets or sets the set of excluded features.
   */
  exclusionSet?: number[] | null;
  /**
   * Gets or sets the data connection of the masking data.
   */
  featureMasks?: CIMDataConnection[] | null;
  /**
   * Gets or sets the collection of label class definitions.
   */
  labelClasses?: CIMLabelClass[] | null;
  /**
   * Gets or sets a value indicating whether to display labels for this layer's label classes.
   */
  labelVisibility?: boolean;
  /**
   * Gets or sets the masked symbol layers. Each SymbolLayerMasking gives the symbol
   * layers that are masked by that masking layer.
   */
  maskedSymbolLayers?: CIMSymbolLayerMasking[] | null;
  /**
   * Gets or sets the primary symbol renderer.
   */
  renderer?: null | CIMRenderer;
  /**
   * Gets or sets a value indicating whether to scale the symbols in this layer based on the map's reference scale.
   */
  scaleSymbols?: boolean;
  /**
   * Gets or sets a value indicating whether this layer participates in snapping in the editor.
   */
  snappable?: boolean;
  /**
   * Gets or sets the symbol layer drawing properties.
   */
  symbolLayerDrawing?: null | CIMSymbolLayerDrawing;
  /**
   * Gets or sets the track renderer when displaying tracks.
   */
  trackLinesRenderer?: null | CIMRenderer;
  /**
   * Gets or sets the previous observations renderer.
   */
  previousObservationsRenderer?: null | CIMRenderer;
  /**
   * Gets or sets the previous observation count.
   */
  previousObservationsCount?: number;
  /**
   * Gets or sets a value indicating whether to use real world symbols sizes (meters) vs. points.
   */
  useRealWorldSymbolSizes?: boolean;
  /**
   * Gets or sets a value indicating whether previous observations are being drawn.
   */
  showPreviousObservations?: boolean;
  /**
   * Gets or sets the feature reduction technique in use by this layer.
   */
  featureReduction?: null | CIMFeatureReduction;
  /**
   * Gets or sets a value indicating whether track lines are being drawn.
   */
  showTracks?: boolean;
  /**
   * Gets or sets a value indicating whether to automatically generate feature templates from the renderer.
   */
  autoGenerateFeatureTemplates?: boolean;
  /**
   * Gets or sets the feature extrusion.
   */
  extrusion?: null | CIMFeatureExtrusion;
  /**
   * Gets or sets the feature elevation expression.
   */
  featureElevationExpression?: null | string;
  /**
   * Gets or sets the feature table.
   */
  featureTable?: null | CIMFeatureTable;
  /**
   * Gets or sets the feature templates.
   */
  featureTemplates?: CIMEditingTemplate[] | null;
  /**
   * Gets or sets a value indicating whether HTML pop-ups are enabled.
   */
  htmlPopupEnabled?: boolean;
  /**
   * Gets or sets the HTML pop-ups format.
   */
  htmlPopupFormat?: null | CIMHtmlPopupFormat;
  /**
   * Gets or sets a value indicating whether the layer is flattened.
   */
  isFlattened?: boolean;
  /**
   * Gets or sets a value indicating whether the layer is selectable.
   */
  selectable?: boolean;
  /**
   * Gets or sets the selection color. For polygons, this is used as the outline color.
   */
  selectionColor?: null | CIMColor;
  /**
   * Gets or sets the selection fill color. Only used for polygons.
   */
  polygonSelectionFillColor?: null | CIMColor;
  /**
   * Gets or sets the selection symbol.
   */
  selectionSymbol?: null | CIMSymbolReference;
  /**
   * Gets or sets a value indicating whether to use the selection symbol.
   */
  useSelectionSymbol?: boolean;
  /**
   * Gets or sets the page definition which allows for using current map series page to filter features.
   */
  pageDefinition?: null | CIMPageDefinition;
  /**
   * Gets or sets the feature cache type.
   */
  featureCacheType?: FeatureCacheType;
  /**
   * Gets or sets a value indicating whether the current set of display filters are honored during drawing.
   */
  enableDisplayFilters?: boolean;
  /**
   * Gets or sets the current set of scale based display filters.
   */
  displayFilters?: CIMDisplayFilter[] | null;
  /**
   * Gets or sets DisplayFiltersType value.
   */
  displayFiltersType?: DisplayFilterType;
  /**
   * Gets or sets the active display filter.
   */
  displayFilterName?: null | string;
  /**
   * Gets or sets the current set of display filters.
   */
  displayFilterChoices?: CIMDisplayFilter[] | null;
  /**
   * Gets or sets the expression for setting the feature elevation.
   */
  featureElevationExpressionInfo?: null | CIMExpressionInfo;
  /**
   * Gets or sets the per-feature blending mode which allows features in a layer to blend against
   * other features in the same layer that have already drawn.
   */
  featureBlendingMode?: BlendingMode;
  /**
   * Gets or sets the attribution text that appears on a map that draws this layer.
   */
  attribution?: null | string;
  /**
   * Gets or sets the description.
   */
  description?: null | string;
  /**
   * Gets or sets the layer elevation.
   */
  layerElevation?: null | CIMLayerElevationSurface;
  /**
   * Gets or sets a value indicating whether this layer is expanded in the contents pane.
   */
  expanded?: boolean;
  /**
   * Gets or sets the 3D layer properties.
   */
  layer3DProperties?: null | CIM3DLayerProperties;
  /**
   * Gets or sets the URIs of the layers used as masks.
   */
  layerMasks?: string[] | null;
  /**
   * Gets or sets the map layer type.
   */
  layerType?: MapLayerType;
  /**
   * Gets or sets the maximum scale for layer draw (set as the denominator of the scale's representative fraction).
   */
  maxScale?: number;
  /**
   * Gets or sets the minimum scale for layer draw (set as the denominator of the scale's representative fraction).
   */
  minScale?: number;
  /**
   * Gets or sets a value indicating whether or not to show legends.
   */
  showLegends?: boolean;
  /**
   * Gets or sets the transparency of the layer.
   */
  transparency?: number;
  /**
   * Gets or sets a value indicating whether or not this layer is visible.
   */
  visibility?: boolean;
  /**
   * Gets or sets the display cache type.
   */
  displayCacheType?: DisplayCacheType;
  /**
   * Gets or sets the maximum display cache age.
   */
  maxDisplayCacheAge?: number;
  /**
   * Gets or sets the layer template.
   */
  layerTemplate?: null | CIMLayerTemplate;
  /**
   * Gets or sets the pop-up info.
   */
  popupInfo?: null | CIMPopupInfo;
  /**
   * Gets or sets a value indicating whether or not to show pop-ups.
   */
  showPopups?: boolean;
  /**
   * Gets or sets identifier that will be used to identify the layer in server.
   */
  serviceLayerID?: number;
  /**
   * Gets or sets identifier the layer's charts.
   */
  charts?: CIMChart[] | null;
  /**
   * Gets or sets a value indicating whether or not this layer should be included in the search.
   * This property is honored only by layers that support search.
   */
  searchable?: boolean;
  /**
   * Gets or sets the amount of time to wait between refreshing the layer.
   */
  refreshRate?: number;
  /**
   * Gets or sets the units for the amount of time to wait between refreshing the layer.
   */
  refreshRateUnit?: EsriTimeUnits;
  /**
   * Gets or sets a value indicating whether or not the display value is shown when hovering over a layer in the view.
   */
  showMapTips?: boolean;
  /**
   * Gets or sets the custom properties of the layer. Custom properties are limited to key / value pairs
   * of strings and developers are fully responsible for stored content.
   */
  customProperties?: CIMStringMap[] | null;
  /**
   * Gets or sets an identifier that will be used to identify the layer in a web map. This value is present
   * if the layer originated in a web map and facilitates matching the layer back to its origin when
   * updating the web map.
   */
  webMapLayerID?: null | string;
  /**
   * Gets or sets the blending mode for the layer.
   */
  blendingMode?: BlendingMode;
  /**
   * Gets or sets a value indicating whether layer can be draped on integrated mesh.
   */
  allowDrapingOnIntegratedMesh?: boolean;
  /**
   * Gets or sets the name.
   */
  name?: null | string;
  /**
   * Gets or sets the URI of the definition. Typically set by the system and used as an identifier.
   */
  uri?: null | string;
  /**
   * Gets or sets the source URI of the item. Set if sourced from an external item such as an item on a portal.
   */
  sourceURI?: null | string;

  /**
   * Gets or sets the metadata URI.
   */
  metadataURI?: null | string;
  /**
   * Gets or sets a value indicating whether the CIM definition accesses metadata from its data source
   * (the default behavior), or if it has its own metadata stored in the project.
   */
  useSourceMetadata?: boolean;
  /**
   * Gets or sets the source portal URI of the item. Set if sourced from an external item such as an item on a portal.
   */
  sourcePortalUrl?: null | string;
};
