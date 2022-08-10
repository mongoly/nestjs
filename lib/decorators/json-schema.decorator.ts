import type { JSONSchemaOptions } from "../types/json-schema-options.type";
import { addJSONSchemaMetadata } from "../storages/type-metadata.storage";

const isClassExtended = (target: Function) =>
  target.toString().includes("extends");

export const Schema =
  (schemaOptions: JSONSchemaOptions = {}) =>
  (target: unknown) => {
    if (!target || typeof target !== "function")
      throw new Error(`@Schema must be used on a class`);
    if (!schemaOptions.noInferExtends && isClassExtended(target)) {
      const extendsClass = Object.getPrototypeOf(target);
      if (extendsClass && extendsClass.constructor)
        schemaOptions.extends = extendsClass;
    }
    addJSONSchemaMetadata(target, { options: schemaOptions });
  };
