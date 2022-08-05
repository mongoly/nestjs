import { JSONSchema } from "@mongoly/core";
import type {
  PropertyOptions,
  PropertyIndexOptions,
} from "../decorators/property.decorator";

export type PropertyMetadata = {
  key: string;
  jsonSchema: JSONSchema;
  options?: PropertyOptions;
  indexOptions?: PropertyIndexOptions;
};
