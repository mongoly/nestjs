import { JSONSchema } from "@mongoly/core";
import type { PropertyOptions } from "./property-options.type";

export type PropertyMetadata = {
  key: string;
  jsonSchema: JSONSchema;
  options: PropertyOptions;
};
