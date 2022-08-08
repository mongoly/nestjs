import type { Type } from "@nestjs/common";
import type { IndexDescription } from "mongodb";
import { getPropertiesByTarget } from "../storages/type-metadata.storage";

export const createIndex = (
  key: string,
  index: 1 | -1 | "text" | "2dsphere",
  isUnique?: boolean,
  isSparse?: boolean,
) => {
  const description: IndexDescription = {
    key: { [key]: index },
  };
  if (isUnique) description.unique = true;
  if (isSparse) description.sparse = true;
  return description;
};

export const createIndexesForClass = <TClass>(
  target: Type<TClass>,
  parentKey?: string,
) => {
  const indexes: IndexDescription[] = [];
  const propertiesMetadata = getPropertiesByTarget(target);
  for (const propertyMetadata of propertiesMetadata) {
    const { options } = propertyMetadata;
    if (!options) continue;
    const isIndexed = options.isIndexed || options.index !== undefined;
    if (parentKey && isIndexed && options.excludeFromIndexes) continue;
    const key = parentKey
      ? `${parentKey}.${propertyMetadata.key}`
      : propertyMetadata.key;
    if (isIndexed) {
      indexes.push(
        !options.index
          ? createIndex(key, 1)
          : createIndex(
              key,
              options.index.is2DSphere
                ? "2dsphere"
                : options.index.isText
                ? "text"
                : options.index.indexDirection || 1,
              options.index.isUnique,
              options.index.isSparse,
            ),
      );
    }
    if (options.isClass && !options.excludeSubIndexes) {
      if (!options.type) throw new Error(`Property "${key}" has no type`);
      const subIndexes = createIndexesForClass(options.type as Type, key);
      indexes.push(...subIndexes);
    }
  }
  return indexes;
};
