import { ModuleRef } from "@nestjs/core";
import { OnApplicationShutdown } from "@nestjs/common";
import { Inject, Global, Module } from "@nestjs/common";
import { MONGO_CONNECTION_NAME } from "./mongoly.constants";
import { ConfigurableModuleClass } from "./mongoly-core.module-definition";

@Global()
@Module({})
export class MongolyCoreModule
  extends ConfigurableModuleClass
  implements OnApplicationShutdown
{
  constructor(
    @Inject(MONGO_CONNECTION_NAME) private readonly connectionName: string,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  async onApplicationShutdown() {
    const client = this.moduleRef.get(this.connectionName);
    if (!client) return;
    await client.close();
  }
}
