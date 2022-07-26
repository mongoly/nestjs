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
  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
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

  static forFeature(
    collections: CollectionProviderOptions[] = [],
    connectionName?: string
  ): DynamicModule {
    const providers = collections.map((collection) =>
      createCollectionProvider(collection, connectionName)
    );
    return {
      module: MongolyModule,
      providers: providers,
      exports: providers,
    };
  }
}
