import type { JSONSchemaObject } from "@mongoly/core";

export type JSONSchemaOptions = {
  mergeWith?: JSONSchemaObject | JSONSchemaObject[];
  omitProperties?: string[];
  pickProperties?: string[];
  renameProperties?: Record<string, string>;
};
