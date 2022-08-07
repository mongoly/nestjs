import { JSONSchemaObject } from "@mongoly/core";
import { flatten, Type } from "@nestjs/common";
import type { PropertyMetadata } from "../types/property-metadata.type";
import type { JSONSchemaMetadata } from "../types/json-schema-metadata.type";
import {
  getJSONSchemaMetadataByTarget,
  getPropertiesByTarget,
} from "../storages/type-metadata.storage";
import {
  hasJSONSchema,
  getJSONSchema,
  setJSONSchema,
} from "../storages/json-schema.storage";

const createJSONSchemaProperties = (
  jsonSchema: JSONSchemaObject,
  propertiesMetadata: PropertyMetadata[],
) => {
  if (propertiesMetadata.length === 0) return;
  jsonSchema.properties = {};
  for (const propertyMetadata of propertiesMetadata) {
    const { key, jsonSchema: propJSONSchema, options = {} } = propertyMetadata;
    if (!propJSONSchema) {
      throw new Error(`Property ${key} has no JSON schema`);
    }
    if (options.isRequired) {
      if (!jsonSchema.required) jsonSchema.required = [];
      jsonSchema.required.push(key);
    }
    jsonSchema.properties[key] = propJSONSchema;
  }
};

const mergeJSONSchemas = (
  target: JSONSchemaObject,
  source: JSONSchemaObject,
) => {
  if (source.required) {
    if (target.required) {
      const required = [...target.required, ...source.required];
      const uniqueRequired = new Set(flatten(required));
      target.required = [...uniqueRequired];
    } else target.required = source.required;
  }
  if (source.properties)
    target.properties = { ...source.properties, ...target.properties };
};

const transformJSONSchema = (
  jsonSchema: JSONSchemaObject,
  metadataOptions: JSONSchemaMetadata["options"],
) => {
  if (metadataOptions.mergeWith) {
    if (metadataOptions.mergeWith instanceof Array) {
      for (const mergeWith of metadataOptions.mergeWith)
        mergeJSONSchemas(jsonSchema, mergeWith);
    } else mergeJSONSchemas(jsonSchema, metadataOptions.mergeWith);
  }
  if (jsonSchema.properties) {
    if (metadataOptions.omitProperties && metadataOptions.pickProperties) {
      throw new Error(
        `Cannot use both "omitProperties" and "pickProperties" options`,
      );
    }
    if (metadataOptions.omitProperties) {
      for (const property of metadataOptions.omitProperties)
        delete jsonSchema.properties[property];
    }
    if (metadataOptions.pickProperties) {
      const propertiesToPick = metadataOptions.pickProperties;
      const propertiesToOmit = Object.keys(jsonSchema.properties).filter(
        (property) => !propertiesToPick.includes(property),
      );
      for (const property of propertiesToOmit)
        delete jsonSchema.properties[property];
    }
    if (metadataOptions.renameProperties) {
      for (const [oldName, newName] of Object.entries(
        metadataOptions.renameProperties,
      )) {
        if (jsonSchema.properties[oldName]) {
          jsonSchema.properties[newName] = jsonSchema.properties[oldName]!;
          delete jsonSchema.properties[oldName];
        }
      }
    }
  }
};

export const createJSONSchemaForClass = <TClass>(target: Type<TClass>) => {
  if (hasJSONSchema(target)) return getJSONSchema(target);

  const metadata = getJSONSchemaMetadataByTarget(target);
  if (!metadata)
    throw new Error(`No JSONSchema metadata found for class ${target.name}`);
  const metadataOptions = metadata.options;

  const jsonSchema: JSONSchemaObject = { bsonType: "object" };

  const propertiesMetadata = getPropertiesByTarget(target);
  createJSONSchemaProperties(jsonSchema, propertiesMetadata);
  transformJSONSchema(jsonSchema, metadataOptions);

  setJSONSchema(target, jsonSchema);

  return jsonSchema;
};
