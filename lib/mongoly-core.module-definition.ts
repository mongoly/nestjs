import { ConfigurableModuleBuilder } from "@nestjs/common";

import type { MongolyModuleOptions } from "./types/mongoly-module-options.type";
import { MONGOLY_MODULE_OPTIONS_TOKEN } from "./mongoly.constants";
import { getConnectionToken } from "./common/mongoly.utils";
import {
  createNameProvider,
  createConnectionProvider,
} from "./mongoly.providers";

type MongolyCoreModuleOptions = { name?: string };

export const { ConfigurableModuleClass, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<MongolyModuleOptions>({
    optionsInjectionToken: MONGOLY_MODULE_OPTIONS_TOKEN,
  })
    .setClassMethodName("forRoot")
    .setFactoryMethodName("createMongolyOptions")
    .setExtras<MongolyCoreModuleOptions>({}, (definitions, { name }) => {
      const token = getConnectionToken(name);
      const nameProvider = createNameProvider(token);
      const connectionProvider = createConnectionProvider(token);
      const providers = (definitions.providers ??= []);
      const exports = (definitions.exports ??= []);
      providers.push(nameProvider, connectionProvider);
      exports.push(connectionProvider);
      return definitions;
    })
    .build();
