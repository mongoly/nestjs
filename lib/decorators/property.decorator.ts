import { Type } from "@nestjs/common";
import type { BSONType, JSONSchema } from "@mongoly/core";
import { ObjectId } from "mongodb";
import type {
  PropertyOptions,
  ExtendedPropertyOptions,
  PropertyIndexOptions,
} from "../types/property-options.type";
import { addPropertyMetadata } from "../storages/type-metadata.storage";
import { getJSONSchema } from "../storages/json-schema.storage";

const SUPPORTED_DATA_TYPES = [Number, String, Boolean, Date, ObjectId];

const DATA_TYPE_TO_BSON_TYPE = new Map<Function, BSONType>([
  [Number, "number"],
  [Boolean, "bool"],
  [String, "string"],
  [Date, "date"],
  [ObjectId, "objectId"],
]);

const getBsonType = (type: unknown) => {
  if (typeof type !== "function")
    throw new Error("Type must be a primitive function");
  const bsonType = DATA_TYPE_TO_BSON_TYPE.get(type);
  if (!bsonType) throw new Error(`Unsupported data type: ${type.name}`);
  return bsonType;
};

const inspectType = (type: unknown): BSONType | BSONType[] => {
  if (type instanceof Array) {
    const bsonTypes = type.map(getBsonType);
    return bsonTypes;
  }
  return getBsonType(type);
};

const createJSONSchemaForProperty = (
  target: unknown,
  propertyKey: string,
  propertyOptions?: ExtendedPropertyOptions,
): JSONSchema => {
  if (!target || typeof target !== "object")
    throw new Error(`@Property must be used in a class`);
  if (!propertyOptions) return {};

  if (propertyOptions.enum) {
    if (typeof propertyOptions.enum !== "object")
      throw new Error(`enum values must be an object`);
    if (!(propertyOptions.enum instanceof Array))
      propertyOptions.enum = Object.values(propertyOptions.enum);
    if (propertyOptions.isNullable) propertyOptions.enum.push(null);
    const designType = Reflect.getMetadata("design:type", target, propertyKey);
    if (designType === Array)
      return {
        bsonType: "array",
        items: { enum: propertyOptions.enum },
      };
    return { enum: propertyOptions.enum };
  }

  const designType = Reflect.getMetadata("design:type", target, propertyKey);
  let bsonType = propertyOptions.type
    ? inspectType(propertyOptions.type)
    : getBsonType(designType);
  if (!propertyOptions.schema) propertyOptions.schema = {};
  if (bsonType instanceof Array) {
    const parentBSONType = propertyOptions.isNullable
      ? ["array", "null"]
      : "array";
    return {
      bsonType: parentBSONType,
      items: { bsonType, ...propertyOptions.schema },
    };
  }

  if (propertyOptions.isNullable) {
    if (!Array.isArray(bsonType)) bsonType = [bsonType];
    bsonType.push("null");
  }

  return { bsonType, ...propertyOptions.schema };
};

export const RawProp =
  (
    jsonSchema: JSONSchema,
    propertyOptions?: PropertyOptions,
    propertyIndexOptions?: PropertyIndexOptions,
  ) =>
  (target: unknown, propertyKey: string) => {
    addPropertyMetadata((target as Object).constructor, {
      jsonSchema,
      key: propertyKey,
      options: propertyOptions,
      indexOptions: propertyIndexOptions,
    });
  };

export const Prop =
  (
    propertyOptions?: ExtendedPropertyOptions,
    propertyIndexOptions?: PropertyIndexOptions,
  ) =>
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
      indexOptions: propertyIndexOptions,
    });
  };
