import type { Type } from "@nestjs/common";
import type { JSONSchemaObject } from "@mongoly/core";

const jsonSchemas = new WeakMap<Type, JSONSchemaObject>();

export const getJSONSchema = (target: Type) => jsonSchemas.get(target);

export const hasJSONSchema = (target: Type) => jsonSchemas.has(target);

export const setJSONSchema = (target: Type, jsonSchema: JSONSchemaObject) =>
  jsonSchemas.set(target, jsonSchema);
