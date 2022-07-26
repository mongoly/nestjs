import type { JsonSchemaObject } from "@mongoly/core";
import { addJSONSchemaMetadata } from "../storages/type-metadata.storage";

export type JSONSchemaOptions = {
  mergeWith?: JsonSchemaObject | JsonSchemaObject[];
  omitProperties?: string[];
  pickProperties?: string[];
  renameProperties?: Record<string, string>;
};

export const Schema =
  (jsonSchemaOptions: JSONSchemaOptions = {}) =>
  (target: unknown) => {
    if (!target || typeof target !== "function")
      throw new Error(`@Schema must be used on a class`);
    addJSONSchemaMetadata(target, {
      target,
      options: jsonSchemaOptions,
    });
  };
