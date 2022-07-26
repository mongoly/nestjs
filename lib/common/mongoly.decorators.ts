import { Inject } from "@nestjs/common";
import { getConnectionToken, getCollectionToken } from "./mongoly.utils";

export const InjectConnection = (name?: string) =>
  Inject(getConnectionToken(name));

export const InjectCollection = (name: string, connectionName?: string) =>
  Inject(getCollectionToken(name, connectionName));
