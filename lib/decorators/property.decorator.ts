import { Type } from "@nestjs/common";
import type {
  ArrayKeywords,
  BSONType,
  JSONSchema,
  ScalarKeywords,
} from "@mongoly/core";
import { ObjectId } from "mongodb";
import type { PropertyOptions } from "../types/property-options.type";
import { addPropertyMetadata } from "../storages/type-metadata.storage";
import { getJSONSchema } from "../storages/json-schema.storage";

const DATA_TYPE_TO_BSON_TYPE = new Map<Type, BSONType>([
  [Number, "number"],
  [Boolean, "bool"],
  [String, "string"],
  [Date, "date"],
  [ObjectId, "objectId"],
]);

const getArrayKeywords = (propertyOptions: PropertyOptions): ArrayKeywords => {
  const arrayProps: ArrayKeywords = {};
  if (propertyOptions.schema) {
    if (propertyOptions.schema.minItems)
      arrayProps.minItems = propertyOptions.schema.minItems;
    if (propertyOptions.schema.maxItems)
      arrayProps.maxItems = propertyOptions.schema.maxItems;
    if (propertyOptions.schema.uniqueItems)
      arrayProps.uniqueItems = propertyOptions.schema.uniqueItems;
  }
  return arrayProps;
};

const getScalarKeywords = (
  propertyOptions: PropertyOptions,
): ScalarKeywords => {
  const scalarProps: ScalarKeywords = {};
  if (propertyOptions.schema) {
    if (propertyOptions.schema.minimum)
      scalarProps.minimum = propertyOptions.schema.minimum;
    if (propertyOptions.schema.maximum)
      scalarProps.maximum = propertyOptions.schema.maximum;
    if (propertyOptions.schema.exclusiveMinimum)
      scalarProps.exclusiveMinimum = propertyOptions.schema.exclusiveMinimum;
    if (propertyOptions.schema.exclusiveMaximum)
      scalarProps.exclusiveMaximum = propertyOptions.schema.exclusiveMaximum;
    if (propertyOptions.schema.multipleOf)
      scalarProps.multipleOf = propertyOptions.schema.multipleOf;
    if (propertyOptions.schema.minLength)
      scalarProps.minLength = propertyOptions.schema.minLength;
    if (propertyOptions.schema.maxLength)
      scalarProps.maxLength = propertyOptions.schema.maxLength;
    if (propertyOptions.schema.pattern)
      scalarProps.pattern = propertyOptions.schema.pattern;
  }
  return scalarProps;
};

const createJSONSchemaForProperty = (
  target: unknown,
  propertyKey: string,
  propertyOptions: PropertyOptions,
): JSONSchema => {
  if (!target || typeof target !== "object")
    throw new Error("@Property must be used in a class");

  const className = target.constructor.name;
  const propertyPath = `${className}.${propertyKey}`;

  const arrayProps = getArrayKeywords(propertyOptions);
  const scalarProps = getScalarKeywords(propertyOptions);

  const designType = Reflect.getMetadata("design:type", target, propertyKey);
  if (!propertyOptions.isArray) propertyOptions.isArray = designType === Array;

  if (propertyOptions.enum) {
    if (typeof propertyOptions.enum !== "object")
      throw new Error("enum values must be an object");
    if (!(propertyOptions.enum instanceof Array))
      propertyOptions.enum = Object.values(propertyOptions.enum);
    if (propertyOptions.isNullable) propertyOptions.enum.push(null);
    return propertyOptions.isArray
      ? {
          bsonType: "array",
          items: { enum: propertyOptions.enum },
          ...arrayProps,
        }
      : { enum: propertyOptions.enum };
  }

  if (propertyOptions.type && propertyOptions.isClass) {
    let jsonSchema = getJSONSchema(propertyOptions.type);
    if (!jsonSchema)
      throw new Error(
        `Could not find JSON schema for ${propertyOptions.type.name} at ${propertyPath}`,
      );
    return propertyOptions.isArray
      ? {
          bsonType: propertyOptions.isNullable ? ["array", "null"] : "array",
          items: jsonSchema,
          ...arrayProps,
        }
      : {
          ...jsonSchema,
          bsonType: propertyOptions.isNullable ? ["object", "null"] : "object",
        };
  }

  let targetType = propertyOptions.type || designType;
  let bsonType = DATA_TYPE_TO_BSON_TYPE.get(targetType);
  if (!bsonType) throw new Error(`Unable to determine type at ${propertyPath}`);
  return propertyOptions.isArray
    ? {
        bsonType: propertyOptions.isNullable ? ["array", "null"] : "array",
        items: { bsonType },
        ...arrayProps,
      }
    : {
        bsonType: propertyOptions.isNullable ? [bsonType, "null"] : bsonType,
        ...scalarProps,
      };
};

export const RawProp =
  (
    jsonSchema: JSONSchema | JSONSchema[],
    propertyOptions: PropertyOptions = {},
  ) =>
  (target: unknown, propertyKey: string) => {
    if (propertyOptions.isClass)
      throw new Error("@RawProp does not support `isClass`");
    if (jsonSchema instanceof Array || propertyOptions.isArray) {
      const arrayKeywords = getArrayKeywords(propertyOptions);
      jsonSchema = {
        bsonType: propertyOptions.isNullable ? ["array", "null"] : "array",
        items: jsonSchema,
        ...arrayKeywords,
      };
    } else {
      if (propertyOptions.schema)
        throw new Error(
          "@RawProp does not support schema for non-array properties",
        );
      const typeKeyword = jsonSchema.type ? "type" : "bsonType";
      if (!jsonSchema[typeKeyword])
        throw new Error("JSON schema missing `type` or `bsonType`");
      if (propertyOptions.isNullable) {
        if (jsonSchema[typeKeyword] instanceof Array) {
          (jsonSchema[typeKeyword] as any[]).push("null");
        } else {
          jsonSchema.bsonType = [jsonSchema.bsonType as any, "null"];
        }
      }
    }

    addPropertyMetadata((target as Object).constructor, {
      jsonSchema,
      key: propertyKey,
      options: propertyOptions,
    });
  };

export const Prop =
  (propertyOptions: PropertyOptions = {}) =>
  (target: unknown, propertyKey: string) => {
    const jsonSchema = createJSONSchemaForProperty(
      target,
      propertyKey,
      propertyOptions,
    );
    addPropertyMetadata((target as Object).constructor, {
      jsonSchema,
      key: propertyKey,
      options: propertyOptions,
    });
  };
