import { ConfigurableModuleBuilder } from "@nestjs/common";
import {
  createNameProvider,
  createConnectionProvider,
} from "./mongoly.providers";
import type { MongolyModuleOptions } from "./types/mongoly-module-options.type";

type MongolyCoreModuleOptions = { name?: string };

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<MongolyModuleOptions>({
  moduleName: "MongolyCore",
})
  .setClassMethodName("forRoot")
  .setFactoryMethodName("createMongolyOptions")
  .setExtras<MongolyCoreModuleOptions>({}, (definitions, { name }) => {
    const nameProvider = createNameProvider(name);
    const connectionProvider = createConnectionProvider(name);
    const existingProviders = definitions.providers || [];
    return {
      ...definitions,
      providers: [nameProvider, connectionProvider, ...existingProviders],
      exports: [connectionProvider],
    };
  })
  .build();
