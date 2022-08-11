import type { Type } from "@nestjs/common";
import type { IndexDescription } from "mongodb";
import { getPropertiesByTarget } from "../storages/type-metadata.storage";
import { getIndexes, setIndexes } from "../storages/index.storage";

export const createIndex = (
  key: string,
  index: 1 | -1 | "text" | "2dsphere",
  isUnique?: boolean,
  isSparse?: boolean,
) => {
  if (index !== 1 && index !== -1 && index !== "text" && index !== "2dsphere")
    throw new Error(`Invalid index type at "${key}", got "${index}"`);
  const description: IndexDescription = { key: { [key]: index } };
  if (isUnique) description.unique = true;
  if (isSparse) description.sparse = true;
  return description;
};

export const createIndexesForClass = (target: Type, parentKey?: string) => {
  const existingIndexes = getIndexes(target);
  if (existingIndexes) return existingIndexes;

  const indexes: IndexDescription[] = [];
  const propertiesMetadata = getPropertiesByTarget(target);
  for (const propertyMetadata of propertiesMetadata) {
    const { options } = propertyMetadata;
    if (!options) continue;
    const isIndexed = options.isIndexed || options.index;
    if (parentKey && isIndexed && options.excludeFromIndexes) continue;
    const key = parentKey
      ? `${parentKey}.${propertyMetadata.key}`
      : propertyMetadata.key;
    if (isIndexed) {
      indexes.push(
        typeof options.index === "boolean" || !options.index
          ? createIndex(key, 1)
          : typeof options.index === "number"
          ? createIndex(key, options.index)
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
      if (!options.type) throw new Error(`Property at "${key}" has no type`);
      const subIndexes = createIndexesForClass(options.type as Type, key);
      indexes.push(...subIndexes);
    }
  }

  setIndexes(target, indexes);

  return indexes;
};
