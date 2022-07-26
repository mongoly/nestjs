# @mongoly/nest
The official nest module for mongoly

## Installation
```bash
npm install mongodb @mongoly/core @mongoly/nestjs
```

## Usage
```ts
// app.module.ts
import { Module } from "@nestjs/common";
import { ensureJSONSchema, ensureIndexes } from "@mongoly/core";

@Module({
  imports: [
    MongolyModule.forRoot({
      url: "mongodb://localhost:27017/dev_mongoly_nestjs",
    }),
    CatsModule,
  ],
})
export class AppModule {}
```
```ts
// cats.module.ts
import { Module } from "@nestjs/common";
import { MongolyModule } from "@mongoly/nest";
import { Cat, CatIndexes, CatSchema } from "./cats.entity";
import { CatsService } from "./cats.service";

@Module({
  imports: [
    MongolyModule.forFeature([
      {
        name: Cat.name,
        schema: CatSchema,
        indexes: CatIndexes,
        dropOldIndexes: true,
      },
    ]),
  ],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```
```ts
// cats.entity.ts
import {
  Schema,
  Prop,
  createJSONSchemaForClass,
  createIndexesForClass,
} from "@mongoly/nest";

@Schema()
export class Cat {
  @Prop({ isRequired: true, isIndexed: true })
  name: string;

  @Prop({ isRequired: true, isIndexed: true })
  age: number;

  @Prop({ isRequired: true, isIndexed: true })
  breed: string;
}

export const CatSchema = createJSONSchemaForClass(Cat);
export const CatIndexes = createIndexesForClass(Cat);
```
```ts
// cats.service.ts
import { Injectable } from "@nestjs/common";
import { InjectCollection } from "@mongoly/nest";
import type { Collection } from "mongodb";
import { Cat } from "./cats.entity";

@Injectable()
export class CatsService {
  constructor(
    @InjectCollection(Cat.name) private readonly catsCollection: Collection<Cat>
  ) {}
}
```

