import { CIMActivity, CIMCondition } from "./layers/CIMFeatureLayer";

export type CIMLayerAction = {
    /**
 * Gets or sets the name.
 */
    name?: null | string;
    /**
     * Gets or sets activities.
     */
    activities?: CIMActivity[] | null;
    /**
     * Gets or sets conditions.
     */
    conditions?: CIMCondition[] | null;
};
