import { Type } from "@nestjs/common";

export type JSONSchemaOptions = {
  extends?: Type;
  noInferExtends?: boolean;
  omitProperties?: string[];
  pickProperties?: string[];
  renameProperties?: Record<string, string>;
};
