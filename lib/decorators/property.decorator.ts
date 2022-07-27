import { ObjectId } from "mongodb";
import { BsonType, JSONSchema, JSONSchemaArray } from "@mongoly/core";
import { addPropertyMetadata } from "../storages/type-metadata.storage";

export type PropertyOptions = {
  isRequired?: boolean;
  isNullable?: boolean;
  isIndexed?: boolean;
  isUnique?: boolean;
  jsonSchema?: JSONSchema;
};

export type EnumPropertyOptions<TEnum = unknown> = {
  values: TEnum | TEnum[];
  isArray?: boolean;
} & Omit<PropertyOptions, "jsonSchema">;

export type ArrayPropertyOptions = {
  itemsJSONSchema: JSONSchema | JSONSchema[];
  arrayJSONSchema?: Omit<JSONSchemaArray, "bsonType" | "items">;
} & Omit<PropertyOptions, "jsonSchema">;

const DATA_TYPE_TO_BSON_TYPE = new Map<Function, BsonType>([
  [Number, "number"],
  [Boolean, "bool"],
  [String, "string"],
  [Date, "date"],
  [ObjectId, "objectId"],
  [Buffer, "binData"],
]);

const inspectBsonType = (
  propertyOptions: PropertyOptions,
  jsonSchema: JSONSchema,
  target: unknown,
  propertyKey: string
) => {
  if (!target || typeof target !== "object")
    throw new Error(`@Property must be used in a class`);
  if (!jsonSchema.bsonType) {
    const dataType = Reflect.getMetadata("design:type", target, propertyKey);
    const bsonType = DATA_TYPE_TO_BSON_TYPE.get(dataType);
    if (!bsonType) {
      const hostClass = (target as Object).constructor.name;
      throw new Error(
        `Unsupported data type at "${hostClass}.${propertyKey}", got: ${dataType}`
      );
    } else jsonSchema.bsonType = bsonType;
  }

  if (propertyOptions.isNullable) {
    if (propertyOptions.isRequired)
      throw new Error(
        `@Property cannot be both nullable and required at property "${propertyKey}"`
      );
    if (!(jsonSchema.bsonType instanceof Array))
      jsonSchema.bsonType = [jsonSchema.bsonType, "null"];
    else {
      if (!jsonSchema.bsonType.includes("null"))
        jsonSchema.bsonType.push("null");
    }
  }
};

export const Prop =
  (propertyOptions: PropertyOptions = {}) =>
  (target: unknown, propertyKey: string) => {
    propertyOptions.jsonSchema = propertyOptions.jsonSchema || {};
    const jsonSchema = propertyOptions.jsonSchema;
    inspectBsonType(propertyOptions, jsonSchema, target, propertyKey);
    addPropertyMetadata((target as Object).constructor, {
      key: propertyKey,
      options: propertyOptions,
    });
  };

export const EnumProp =
  (enumPropertyOptions: EnumPropertyOptions) =>
  (target: unknown, propertyKey: string) => {
    let { values, isArray, ...propertyOptions } = enumPropertyOptions;
    if (!values || typeof values !== "object")
      throw new Error(`@EnumProperty values must be an object or an array`);
    if (!(values instanceof Array)) values = Object.values(values);
    const enumJSONSchema: JSONSchema = { enum: values as unknown[] };
    if (propertyOptions.isNullable) enumJSONSchema.enum!.push(null);
    const jsonSchema: JSONSchema = isArray
      ? { bsonType: "array", items: enumJSONSchema }
      : enumJSONSchema;
    addPropertyMetadata((target as Object).constructor, {
      key: propertyKey,
      options: {
        ...propertyOptions,
        jsonSchema,
      },
    });
  };

export const ArrayProp =
  (arrayPropertyOptions: ArrayPropertyOptions) =>
  (target: unknown, propertyKey: string) => {
    const {
      itemsJSONSchema,
      arrayJSONSchema = {},
      ...propertyOptions
    } = arrayPropertyOptions;
    if (!target || typeof target !== "object")
      throw new Error(`@ArrayProperty must be used in a class`);
    const jsonSchema: JSONSchemaArray = {
      ...arrayJSONSchema,
      bsonType: "array",
      items: itemsJSONSchema,
    };
    addPropertyMetadata(target.constructor, {
      key: propertyKey,
      options: {
        ...propertyOptions,
        jsonSchema,
      },
    });
  };
