import type { Type } from "@nestjs/common";
import type { IndexDescription } from "mongodb";
import { getPropertiesByTarget } from "../storages/type-metadata.storage";

export const createIndex = (key: string, isUnique?: boolean) => {
  const description: IndexDescription = {
    key: { [key]: 1 },
  };
  if (isUnique) description.unique = true;
  return description;
};

export const createIndexesForClass = <TClass>(target: Type<TClass>) => {
  const indexes: IndexDescription[] = [];
  const propertiesMetadata = getPropertiesByTarget(target);
  for (const propertyMetadata of propertiesMetadata) {
    const { options } = propertyMetadata;
    if (!options.isIndexed) continue;
    indexes.push(createIndex(propertyMetadata.key, options.isUnique));
  }
  return indexes;
};
