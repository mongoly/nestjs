import type { Type } from "@nestjs/common";
import type { IndexDescription } from "mongodb";

const indexes = new WeakMap<Type, IndexDescription[]>();

export const getIndexes = (target: Type) => indexes.get(target);
export const hasIndexes = (target: Type) => indexes.has(target);
export const setIndexes = (
  target: Type,
  indexDescriptions: IndexDescription[],
) => indexes.set(target, indexDescriptions);
