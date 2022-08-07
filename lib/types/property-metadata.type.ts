import { JSONSchema } from "@mongoly/core";
import type {
  PropertyOptions,
  PropertyIndexOptions,
} from "./property-options.type";

export type PropertyMetadata = {
  key: string;
  jsonSchema: JSONSchema;
  options?: PropertyOptions;
  indexOptions?: PropertyIndexOptions;
};
