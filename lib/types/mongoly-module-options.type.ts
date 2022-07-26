import { MongoClientOptions } from "mongodb";

export type MongolyModuleOptions = { url: string } & MongoClientOptions;
