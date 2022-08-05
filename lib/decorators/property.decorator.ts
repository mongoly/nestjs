import { ObjectId } from "mongodb";
import type {
  BsonType,
  JSONSchema,
  JSONSchemaArray,
  JSONSchemaEnum,
} from "@mongoly/core";
import { addPropertyMetadata } from "../storages/type-metadata.storage";

export type PropertyIndexOptions = {
  isIndexed?: boolean;
  isText?: boolean;
  is2DSphere?: boolean;

  isUnique?: boolean;
  isSparse?: boolean;
  expireAfterSeconds?: number;

  excludeIndexes?: boolean | string[];
};

export type PropertyOptions<TClass = any, TEnum = any> = {
  isRequired?: boolean;
  isNullable?: boolean;
  description?: string;
  enum?: TEnum | TEnum[];
  classType?: TClass;
  bsonType?: BsonType | BsonType[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minItems?: number;
  maxItems?: number;
};

const DATA_TYPE_TO_BSON_TYPE = new Map<Function, BsonType>([
  [Number, "number"],
  [Boolean, "bool"],
  [String, "string"],
  [Date, "date"],
  [Object, "object"],
  [ObjectId, "objectId"],
  [Buffer, "binData"],
]);

const getBsonType = (type: unknown) => {
  if (typeof type !== "function")
    throw new Error("Type must be a primitive function");
  const bsonType = DATA_TYPE_TO_BSON_TYPE.get(type);
  if (!bsonType) throw new Error(`Unsupported data type: ${type.toString()}`);
  return bsonType;
};

const inspectType = (type: unknown): BsonType | BsonType[] => {
  if (Array.isArray(type)) {
    const bsonTypes = type.map(getBsonType);
    return bsonTypes;
  }
  return getBsonType(type);
};

const isNumberBSONType = (bsonType: BsonType) =>
  bsonType === "double" ||
  bsonType === "int" ||
  bsonType === "long" ||
  bsonType === "decimal" ||
  bsonType === "number";

const createJSONSchemaForProperty = (
  target: unknown,
  propertyKey: string,
  propertyOptions?: PropertyOptions
) => {
  if (!target || typeof target !== "object")
    throw new Error(`@Property must be used in a class`);
  if (!propertyOptions) return {} as JSONSchema;

  if (propertyOptions.isRequired && propertyOptions.isNullable)
    throw new Error(`
        Property "${propertyKey}" cannot be both nullable and required.`);

  if (propertyOptions.enum) {
    const designType = Reflect.getMetadata("design:type", target, propertyKey);
    if (!Array.isArray(propertyOptions.enum))
      propertyOptions.enum = Object.values(propertyOptions.enum);
    if (propertyOptions.isNullable) propertyOptions.enum.push(null);
    if (designType === Array) {
      return {
        bsonType: "array",
        items: {
          enum: propertyOptions.enum,
        },
      } as JSONSchemaArray;
    } else {
      return { enum: propertyOptions.enum } as JSONSchemaEnum;
    }
  }

  let bsonType: BsonType | BsonType[] | undefined;
  if (!propertyOptions.bsonType) {
    // First, lets inspect the class type if it exists
    if (propertyOptions.classType) {
      bsonType = inspectType(propertyOptions.classType);
      if (Array.isArray(bsonType)) {
        if (propertyOptions.isNullable) bsonType.push("null");
        return {
          bsonType: "array",
          items: {
            bsonType,
          },
        };
      }
    } else {
      // If that doesn't exist, lets inspect the type of the property
      const designType = Reflect.getMetadata(
        "design:type",
        target,
        propertyKey
      );
      bsonType = inspectType(designType);
      if (Array.isArray(bsonType))
        throw new Error("Expected a single BSON type");
      if (propertyOptions.isNullable) bsonType = [bsonType, "null"];
      return {};
    }
  }

  return {};
};

export const Prop =
  (
    propertyOptions?: PropertyOptions,
    propertyIndexOptions?: PropertyIndexOptions
  ) =>
  (target: unknown, propertyKey: string) => {
    const jsonSchema = createJSONSchemaForProperty(
      target,
      propertyKey,
      propertyOptions
    );
    addPropertyMetadata((target as Object).constructor, {
      jsonSchema,
      key: propertyKey,
      options: propertyOptions,
      indexOptions: propertyIndexOptions,
    });
  };
