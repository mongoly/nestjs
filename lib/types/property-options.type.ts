import type { Type } from "@nestjs/common";
import type { JSONSchema } from "@mongoly/core";

export type PropertyIndexOptions = {
  isIndexed?: boolean | 1 | -1;
  isText?: boolean;
  is2DSphere?: boolean;

  isUnique?: boolean;
  isSparse?: boolean;
  expireAfterSeconds?: number;

  excludeIndexes?: boolean | string[];
};

export type PropertyOptions = { isRequired?: boolean; type?: Type };

export type ExtendedPropertyOptions = PropertyOptions & {
  isNullable?: boolean;
  enum?: unknown[];
  schema?: JSONSchema;
};
