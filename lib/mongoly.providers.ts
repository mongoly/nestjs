import type { FactoryProvider, ValueProvider } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { JsonSchemaObject } from "@mongoly/core";
import { ensureJSONSchema, ensureIndexes } from "@mongoly/core";
import type { IndexDescription } from "mongodb";
import { MongoClient } from "mongodb";
import { getConnectionToken, getCollectionToken } from "./common/mongoly.utils";
import type { MongolyModuleOptions } from "./types/mongoly-module-options.type";
import { MODULE_OPTIONS_TOKEN } from "./mongoly-core.module-definition";
import { MONGO_CONNECTION_NAME } from "./mongoly.constants";

const logger = new Logger("MongolyModule");

export const createNameProvider = (name?: string): ValueProvider => ({
  provide: MONGO_CONNECTION_NAME,
  useValue: getConnectionToken(name),
});

export const createConnectionProvider = (name?: string): FactoryProvider => ({
  provide: getConnectionToken(name),
  useFactory: async ({ url, ...options }: MongolyModuleOptions) => {
    logger.log(`Connecting to MongoDB at ${url}`);
    const client = new MongoClient(url, options);
    await client.connect();
    logger.log(`Connected to MongoDB at ${url}`);
    return client;
  },
  inject: [MODULE_OPTIONS_TOKEN],
});

const pluralize = (str: string) => (str.endsWith("s") ? str : `${str}s`);

const camelToSnakeCase = (str: string) =>
  str.replace(
    /[A-Z]/g,
    (letter, i) => `${i === 0 ? "" : "_"}${letter.toLowerCase()}`
  );

export type CollectionProviderOptions = {
  name: string;
  dropOldIndexes?: boolean;
  indexes?: IndexDescription[];
  schema?: JsonSchemaObject;
};

export const createCollectionProvider = (
  { name, dropOldIndexes, indexes, schema }: CollectionProviderOptions,
  mongoClientName?: string
): FactoryProvider => ({
  provide: getCollectionToken(name, mongoClientName),
  useFactory: async (client: MongoClient) => {
    const pluralized = camelToSnakeCase(pluralize(name)).toLowerCase();
    const db = client.db();
    const collection = db.collection(pluralized);
    if (schema) await ensureJSONSchema(db, pluralized, schema);
    if (indexes) {
      if (typeof dropOldIndexes !== "boolean") {
        throw new Error(
          `"dropOldIndexes" must be a boolean, but got ${typeof dropOldIndexes}`
        );
      }
      await ensureIndexes(collection, dropOldIndexes, indexes);
    }
    return collection;
  },
  inject: [getConnectionToken(mongoClientName)],
});
