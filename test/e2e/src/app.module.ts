import { Module } from "@nestjs/common";
import { MongolyModule } from "../../../lib";
import { CatsModule } from "./cats";

@Module({
  imports: [
    MongolyModule.forRoot({
      url: "mongodb://localhost:27017/dev_mongoly_nestjs",
    }),
    CatsModule,
  ],
})
export class AppModule {}
