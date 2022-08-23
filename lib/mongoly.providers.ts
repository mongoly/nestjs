import type {
  FactoryProvider,
  ValueProvider,
  InjectionToken,
} from "@nestjs/common";
import { Logger } from "@nestjs/common";
import type { JSONSchemaObject } from "@mongoly/core";
import { ensureJSONSchema, ensureIndexes } from "@mongoly/core";
import type { IndexDescription } from "mongodb";
import { MongoClient } from "mongodb";
import pluralize from "pluralize";
import snakecase from "snakecase";

import type { MongolyModuleOptions } from "./types/mongoly-module-options.type";
import {
  MONGO_CONNECTION_NAME_TOKEN,
  MONGOLY_MODULE_OPTIONS_TOKEN,
} from "./mongoly.constants";
import { getConnectionToken, getCollectionToken } from "./common/mongoly.utils";

const logger = new Logger("MongolyModule");

export const createNameProvider = (token: InjectionToken): ValueProvider => ({
  provide: MONGO_CONNECTION_NAME_TOKEN,
  useValue: token,
});

export const createConnectionProvider = (
  token: InjectionToken,
): FactoryProvider => ({
  provide: token,
  useFactory: async ({ url, ...options }: MongolyModuleOptions) => {
    logger.log("Establishing connection ...");
    const client = new MongoClient(url, options);
    await client.connect();
    logger.log("Connection established");
    return client;
  },
  inject: [MONGOLY_MODULE_OPTIONS_TOKEN],
});

export type CollectionProviderOptions = {
  name: string;
  collectionName?: string;
  schema?: JSONSchemaObject;
  indexes?: IndexDescription[];
};

export const createCollectionProvider = (
  { name, collectionName, schema, indexes }: CollectionProviderOptions,
  mongoClientName?: string,
): FactoryProvider => ({
  provide: getCollectionToken(name, mongoClientName),
  useFactory: async (client: MongoClient) => {
    if (!collectionName) collectionName = pluralize(snakecase(name));
    const db = client.db();
    if (schema) await ensureJSONSchema(db, collectionName, schema);
    const collection = db.collection(collectionName);
    if (indexes) await ensureIndexes(collection, true, indexes);
    return collection;
  },
  inject: [getConnectionToken(mongoClientName)],
});
