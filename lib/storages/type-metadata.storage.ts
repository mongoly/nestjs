import type { JSONSchemaMetadata } from "../types/json-schema-metadata.type";
import type { PropertyMetadata } from "../types/property-metadata.type";

const jsonSchemaMetadata = new WeakMap<Function, JSONSchemaMetadata>();
const propertyMetadata = new WeakMap<Function, PropertyMetadata[]>();

export const getPropertiesByTarget = (target: Function) =>
  propertyMetadata.get(target) || [];

export const addPropertyMetadata = (
  target: Function,
  metadata: PropertyMetadata,
) => {
  const properties = propertyMetadata.get(target) || [];
  properties.push(metadata);
  propertyMetadata.set(target, properties);
};

export const getJSONSchemaMetadataByTarget = (target: Function) =>
  jsonSchemaMetadata.get(target) || { options: {} };

export const addJSONSchemaMetadata = (
  target: Function,
  metadata: JSONSchemaMetadata,
) => {
  if (!metadata.options.extends) {
    const parent = Object.getPrototypeOf(target);
    if (
      parent.prototype !== undefined &&
      parent.prototype.constructor !== Function.prototype
    )
      metadata.options.extends = parent;
  }
  jsonSchemaMetadata.set(target, metadata);
};
