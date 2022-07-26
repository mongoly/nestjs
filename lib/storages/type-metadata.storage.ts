import type { JSONSchemaMetadata } from "../types/json-schema-metadata.type";
import type { PropertyMetadata } from "../types/property-metadata.type";

const jsonSchemaMetadata = new WeakMap<Function, JSONSchemaMetadata>();
const propertyMetadata = new WeakMap<Function, PropertyMetadata[]>();

export const addPropertyMetadata = (
  target: Function,
  metadata: PropertyMetadata
) => {
  const properties = propertyMetadata.get(target) || [];
  properties.push(metadata);
  propertyMetadata.set(target, properties);
};

export const getJSONSchemaMetadataByTarget = (target: Function) =>
  jsonSchemaMetadata.get(target);

export const getPropertiesByTarget = (target: Function) =>
  propertyMetadata.get(target) || [];

export const addJSONSchemaMetadata = (
  target: Function,
  metadata: JSONSchemaMetadata
) => jsonSchemaMetadata.set(target, metadata);
