import type { JSONSchemaOptions } from "../decorators/json-schema.decorator";

export type JSONSchemaMetadata = {
  target: Function;
  options: JSONSchemaOptions;
};
