import {
  Schema,
  Prop,
  createJSONSchemaForClass,
  createIndexesForClass,
} from "../../../../lib";

@Schema()
export class Cat {
  @Prop({ isRequired: true, isIndexed: true })
  name: string;

  @Prop({ isRequired: true, isIndexed: true })
  age: number;

  @Prop({ isRequired: true, isIndexed: true })
  breed: string;
}

export const CatsSchema = createJSONSchemaForClass(Cat);
export const CatsIndexes = createIndexesForClass(Cat);
