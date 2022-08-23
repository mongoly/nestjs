import type { DynamicModule } from "@nestjs/common";
import { Module } from "@nestjs/common";

import {
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} from "./mongoly-core.module-definition";
import type { CollectionProviderOptions } from "./mongoly.providers";
import { createCollectionProvider } from "./mongoly.providers";
import { MongolyCoreModule } from "./mongoly-core.module";

@Module({})
export class MongolyModule {
  static forRoot(url?: string): DynamicModule;
  static forRoot(options?: typeof OPTIONS_TYPE): DynamicModule;
  static forRoot(
    optionsOrUrl: string | typeof OPTIONS_TYPE = "mongodb://localhost:27017",
  ): DynamicModule {
    const options =
      typeof optionsOrUrl === "string" ? { url: optionsOrUrl } : optionsOrUrl;
    return {
      module: MongolyModule,
      imports: [MongolyCoreModule.forRoot(options)],
    };
  }

  static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      module: MongolyModule,
      imports: [MongolyCoreModule.forRootAsync(options)],
    };
  }

  static forFeature(collection: CollectionProviderOptions): DynamicModule;
  static forFeature(collections: CollectionProviderOptions[]): DynamicModule;
  static forFeature(
    collectionOrCollections:
      | CollectionProviderOptions
      | CollectionProviderOptions[],
    connectionName?: string,
  ): DynamicModule {
    if (!Array.isArray(collectionOrCollections))
      collectionOrCollections = [collectionOrCollections];
    const providers = collectionOrCollections.map((collection) =>
      createCollectionProvider(collection, connectionName),
    );
    return {
      module: MongolyModule,
      providers: providers,
      exports: providers,
    };
  }
}
