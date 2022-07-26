export const getConnectionToken = (name = "Default") => `${name}Connection`;

export const getCollectionToken = (name: string, connectionName?: string) =>
  `${getConnectionToken(connectionName)}/${name}Collection`;
