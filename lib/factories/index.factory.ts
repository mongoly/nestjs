import type { Type } from "@nestjs/common";
import type { IndexDescription } from "mongodb";
import { getPropertiesByTarget } from "../storages/type-metadata.storage";

export const createIndex = (
  key: string,
  isUnique?: boolean,
  keyPrefix?: string
) => {
  const finalKey = keyPrefix ? `${keyPrefix}.${key}` : key;
  const description: IndexDescription = {
    key: { [finalKey]: 1 },
  };
  if (isUnique) description.unique = true;
  return description;
};

export const createIndexesForClass = <TClass>(
  target: Type<TClass>,
  keyPrefix?: string
) => {
  const indexes: IndexDescription[] = [];
  const propertiesMetadata = getPropertiesByTarget(target);
  for (const propertyMetadata of propertiesMetadata) {
    const { options } = propertyMetadata;
    const isObject = options.jsonSchema?.bsonType === "object";
    if (!options.isIndexed && !isObject) continue;
    if (options.isIndexed)
      indexes.push(
        createIndex(propertyMetadata.key, options.isUnique, keyPrefix)
      );
    if (isObject) {
      const subIndexes = createIndexesForClass(
        options.type,
        propertyMetadata.key
      );
      indexes.push(...subIndexes);
    }
  }
  return indexes;
};
