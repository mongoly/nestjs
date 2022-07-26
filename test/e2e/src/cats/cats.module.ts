import { Module } from "@nestjs/common";
import { MongolyModule } from "../../../../lib";
import { Cat, CatsIndexes, CatsSchema } from "./cats.entity";
import { CatsService } from "./cats.service";

@Module({
  imports: [
    MongolyModule.forFeature([
      {
        name: Cat.name,
        schema: CatsSchema,
        indexes: CatsIndexes,
        dropOldIndexes: true,
      },
    ]),
  ],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
