import type { Type } from "@nestjs/common";
import type { IndexDescription } from "mongodb";
import { getPropertiesByTarget } from "../storages/type-metadata.storage";

export const createIndex = (
  key: string,
  index: 1 | -1 | "text" | "2dsphere",
  isUnique?: boolean,
  isSparse?: boolean,
  keyPrefix?: string,
) => {
  const finalKey = keyPrefix ? `${keyPrefix}.${key}` : key;
  const description: IndexDescription = {
    key: { [finalKey]: index },
  };
  if (isUnique) description.unique = true;
  if (isSparse) description.sparse = true;
  return description;
};

export const createIndexesForClass = <TClass>(
  target: Type<TClass>,
  keyPrefix?: string,
) => {
  const indexes: IndexDescription[] = [];
  const propertiesMetadata = getPropertiesByTarget(target);
  for (const propertyMetadata of propertiesMetadata) {
    const { jsonSchema, options = {}, indexOptions = {} } = propertyMetadata;
    // @ts-ignore
    const isObject = jsonSchema.bsonType === "object";
    if (indexOptions.isIndexed && !isObject) continue;
    if (indexOptions.isIndexed)
      indexes.push(
        createIndex(
          propertyMetadata.key,
          indexOptions.is2DSphere
            ? "2dsphere"
            : indexOptions.isText
            ? "text"
            : 1,
          indexOptions.isUnique,
          indexOptions.isSparse,
          keyPrefix,
        ),
      );
    if (isObject && !indexOptions.excludeIndexes && options.type) {
      const subIndexes = createIndexesForClass(
        options.type,
        propertyMetadata.key,
      );
      indexes.push(...subIndexes);
    }
  }
  return indexes;
};
