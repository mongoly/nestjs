import { JSONSchemaObject } from "@mongoly/core";
import { flatten, Type } from "@nestjs/common";

import type { PropertyMetadata } from "../types/property-metadata.type";
import {
  getJSONSchemaMetadataByTarget,
  getPropertiesByTarget,
} from "../storages/type-metadata.storage";
import { getJSONSchema, setJSONSchema } from "../storages/json-schema.storage";

const createJSONSchemaProperties = (
  parentSchema: JSONSchemaObject,
  propertiesMetadata: PropertyMetadata[],
) => {
  if (propertiesMetadata.length === 0) return;
  parentSchema.properties = {};
  for (const propertyMetadata of propertiesMetadata) {
    const { key, jsonSchema, options } = propertyMetadata;
    if (!jsonSchema) throw new Error(`Property "${key}" has no JSON schema`);
    if (options && options.isRequired) {
      if (!parentSchema.required) parentSchema.required = [];
      parentSchema.required.push(key);
    }
    parentSchema.properties[key] = jsonSchema;
  }
};

const mergeJSONSchemas = (
  target: JSONSchemaObject,
  source: JSONSchemaObject,
) => {
  if (source.required) {
    if (target.required) {
      const required = [...source.required, ...target.required];
      const uniqueRequired = new Set(flatten(required));
      target.required = [...uniqueRequired];
    } else target.required = source.required;
  }
  if (source.properties)
    target.properties = { ...source.properties, ...target.properties };
};

export const createJSONSchemaForClass = (target: Type) => {
  const existingJSONSchema = getJSONSchema(target);
  if (existingJSONSchema) return existingJSONSchema;

  const metadata = getJSONSchemaMetadataByTarget(target);
  const jsonSchema: JSONSchemaObject = { bsonType: "object" };
  const propertiesMetadata = getPropertiesByTarget(target);
  createJSONSchemaProperties(jsonSchema, propertiesMetadata);

  if (metadata.options.extends) {
    const parentJSONSchema = createJSONSchemaForClass(metadata.options.extends);
    mergeJSONSchemas(jsonSchema, parentJSONSchema);
  }

  setJSONSchema(target, jsonSchema);

  return jsonSchema;
};
