import type { JSONSchemaOptions } from "../types/json-schema-options.type";
import { addJSONSchemaMetadata } from "../storages/type-metadata.storage";

export const Schema =
  (schemaOptions: JSONSchemaOptions = {}) =>
  (target: unknown) => {
    if (!target || typeof target !== "function")
      throw new Error(`@Schema must be used on a class`);
    addJSONSchemaMetadata(target, { options: schemaOptions });
  };
