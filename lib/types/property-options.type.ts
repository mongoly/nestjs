import { JSONSchemaArray } from "@mongoly/core";
import type { Type } from "@nestjs/common";

export type PropertyIndexOptions = {
  isIndexed?: boolean;
  indexDirection?: 1 | -1;
  isText?: boolean;
  is2DSphere?: boolean;
  isUnique?: boolean;
  isSparse?: boolean;
  expireAfterSeconds?: number;
};

export type PropertySchemaOptions = {
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
};

export type PropertyOptions = {
  isRequired?: boolean;
  isNullable?: boolean;
  isArrayNonNullable?: boolean;
  isClass?: boolean;
  isArray?: boolean;
  arrayType?: JSONSchemaArray;
  isIndexed?: boolean;
  excludeSubIndexes?: boolean;
  excludeFromIndexes?: boolean;
  type?: Type | Type[];
  enum?: any | any[];
  index?: 1 | -1 | true | PropertyIndexOptions;
  schema?: PropertySchemaOptions;
};
