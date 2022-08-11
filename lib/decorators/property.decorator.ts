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
import { createJSONSchemaForClass } from "../factories/json-schema.factory";

const BUILT_IN_TYPES = new Set<Type>([
  Number,
  String,
  Boolean,
  Date,
  Array,
  Object,
  Set,
  Map,
]);

const DATA_TYPE_TO_BSON_TYPE = new Map<Type, BSONType>([
  [Number, "number"],
  [Boolean, "bool"],
  [String, "string"],
  [Date, "date"],
  [Buffer, "binData"],
  [ObjectId, "objectId"],
]);

const isBuiltInType = (target: Type) => BUILT_IN_TYPES.has(target);

const isClass = (target: unknown): target is Type =>
  typeof target === "function" &&
  /^class\s/.test(Function.prototype.toString.call(target));

const getArrayKeywords = (propertyOptions: PropertyOptions): ArrayKeywords => {
  const arrayProps: ArrayKeywords = {};
  if (propertyOptions.schema) {
    if (propertyOptions.schema.minItems !== undefined)
      arrayProps.minItems = propertyOptions.schema.minItems;
    if (propertyOptions.schema.maxItems !== undefined)
      arrayProps.maxItems = propertyOptions.schema.maxItems;
    if (propertyOptions.schema.uniqueItems !== undefined)
      arrayProps.uniqueItems = propertyOptions.schema.uniqueItems;
  }
  return arrayProps;
};

const getScalarKeywords = (
  propertyOptions: PropertyOptions,
): ScalarKeywords => {
  const scalarProps: ScalarKeywords = {};
  if (propertyOptions.schema) {
    if (propertyOptions.schema.minimum !== undefined)
      scalarProps.minimum = propertyOptions.schema.minimum;
    if (propertyOptions.schema.maximum !== undefined)
      scalarProps.maximum = propertyOptions.schema.maximum;
    if (propertyOptions.schema.exclusiveMinimum !== undefined)
      scalarProps.exclusiveMinimum = propertyOptions.schema.exclusiveMinimum;
    if (propertyOptions.schema.exclusiveMaximum !== undefined)
      scalarProps.exclusiveMaximum = propertyOptions.schema.exclusiveMaximum;
    if (propertyOptions.schema.multipleOf !== undefined)
      scalarProps.multipleOf = propertyOptions.schema.multipleOf;
    if (propertyOptions.schema.minLength !== undefined)
      scalarProps.minLength = propertyOptions.schema.minLength;
    if (propertyOptions.schema.maxLength !== undefined)
      scalarProps.maxLength = propertyOptions.schema.maxLength;
    if (propertyOptions.schema.pattern !== undefined)
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
    throw new Error("`@Property` must be used in a class");

  const className = target.constructor.name;
  const propertyPath = `${className}.${propertyKey}`;
  const designType = Reflect.getMetadata("design:type", target, propertyKey);
  const arrayProps = getArrayKeywords(propertyOptions);

  // Ensure `isArray` is properly inferred
  if (!propertyOptions.isArray) propertyOptions.isArray = designType === Array;
  const arrayBSONType: BSONType | BSONType[] = propertyOptions.isNullable
    ? ["null", "array"]
    : "array";

  if (propertyOptions.enum) {
    if (typeof propertyOptions.enum !== "object")
      throw new Error("enum values must be an object");
    if (!(propertyOptions.enum instanceof Array))
      propertyOptions.enum = Object.values(propertyOptions.enum);
    return propertyOptions.isArray
      ? {
          bsonType: arrayBSONType,
          items: { enum: propertyOptions.enum },
          ...arrayProps,
        }
      : {
          enum: propertyOptions.isNullable
            ? [null, ...propertyOptions.enum]
            : propertyOptions.enum,
        };
  }

  // Ensure `type` & `isClass` are properly inferred
  if (propertyOptions.type && propertyOptions.type instanceof Array) {
    if (propertyOptions.type.length > 1)
      throw new Error(
        `More than one type specified at "${propertyPath}", this is not yet supported.`,
      );
    propertyOptions.type = propertyOptions.type[0];
  }
  if (!propertyOptions.type) propertyOptions.type = designType as Type;
  if (
    !propertyOptions.isClass &&
    isClass(propertyOptions.type) &&
    !isBuiltInType(propertyOptions.type)
  )
    propertyOptions.isClass = true;

  if (propertyOptions.isClass) {
    let jsonSchema = createJSONSchemaForClass(propertyOptions.type);
    return propertyOptions.isArray
      ? {
          bsonType: arrayBSONType,
          items: jsonSchema,
          ...arrayProps,
        }
      : {
          ...jsonSchema,
          bsonType: propertyOptions.isNullable ? ["null", "object"] : "object",
        };
  }

  let bsonType = DATA_TYPE_TO_BSON_TYPE.get(propertyOptions.type);
  if (!bsonType)
    throw new Error(`Unable to determine type at "${propertyPath}"`);
  const scalarProps = getScalarKeywords(propertyOptions);
  return propertyOptions.isArray
    ? {
        bsonType: arrayBSONType,
        items: { bsonType, ...scalarProps },
        ...arrayProps,
      }
    : {
        bsonType: propertyOptions.isNullable ? ["null", bsonType] : bsonType,
        ...scalarProps,
      };
};

export const Raw =
  (
    jsonSchema: JSONSchema | JSONSchema[],
    propertyOptions: PropertyOptions = {},
  ) =>
  (target: unknown, propertyKey: string) => {
    if (jsonSchema instanceof Array || propertyOptions.isArray) {
      const arrayKeywords = getArrayKeywords(propertyOptions);
      jsonSchema = {
        bsonType: propertyOptions.isNullable ? ["array", "null"] : "array",
        items: jsonSchema,
        ...arrayKeywords,
      };
    } else {
      if (!jsonSchema.bsonType && !jsonSchema.type)
        throw new Error("JSON schema missing `type` or `bsonType`");
      else if (jsonSchema.bsonType && jsonSchema.type)
        throw new Error("JSON schema cannot have both `type` and `bsonType`");
      const typeKeyword = jsonSchema.type ? "type" : "bsonType";
      if (propertyOptions.isNullable)
        if (jsonSchema[typeKeyword] instanceof Array)
          (jsonSchema[typeKeyword] as any[]).unshift("null");
        else jsonSchema.bsonType = ["null", jsonSchema.bsonType as any];
    }

    addPropertyMetadata((target as Object).constructor, {
      jsonSchema,
      key: propertyKey,
      options: propertyOptions,
    });
  };

export const Prop =
  (propertyOptionsOrType?: Type | [Type] | PropertyOptions) =>
  (target: unknown, propertyKey: string) => {
    const propertyOptions =
      propertyOptionsOrType !== undefined
        ? typeof propertyOptionsOrType === "function" ||
          propertyOptionsOrType instanceof Array
          ? { type: propertyOptionsOrType }
          : propertyOptionsOrType
        : {};
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
