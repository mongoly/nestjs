import { Type } from "@nestjs/common";
import { JSONSchemaObject } from "@mongoly/core";

export type JSONSchemaOptions = {
  extends?: Type;
  mergeWith?: JSONSchemaObject | JSONSchemaObject[];
  noInferExtends?: boolean;
  omitProperties?: string[];
  pickProperties?: string[];
  renameProperties?: Record<string, string>;
};
