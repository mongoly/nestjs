export const getConnectionToken = (name = "Default") =>
  `${name}MongoConnection`;

export const getCollectionToken = (name: string, connectionName?: string) =>
  `${getConnectionToken(connectionName)}/${name}MongoCollection`;
