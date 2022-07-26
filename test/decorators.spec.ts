import "reflect-metadata";
import { describe, it, expect } from "vitest";
import {
  Prop,
  EnumProp,
  ArrayProp,
  Schema,
  createJSONSchemaForClass,
  createIndexesForClass,
} from "../lib";

describe("Schemas", () => {
  it("Should create a basic schema", () => {
    @Schema()
    class TestClass {
      @Prop({ isRequired: true, isIndexed: true })
      name: string;

      @Prop({ isNullable: true })
      age: number;
    }
    const jsonSchema = createJSONSchemaForClass(TestClass);
    expect(jsonSchema).toEqual({
      bsonType: "object",
      properties: {
        name: { bsonType: "string" },
        age: { bsonType: ["number", "null"] },
      },
      required: ["name"],
    });
  });
  it("Should create an advanced schema", () => {
    enum Gender {
      M,
      F,
    }

    @Schema()
    class FriendClass {
      @Prop()
      name: string;
    }

    const friendJSONSchema = createJSONSchemaForClass(FriendClass);
    expect(friendJSONSchema).toEqual({
      bsonType: "object",
      properties: {
        name: { bsonType: "string" },
      },
    });

    @Schema()
    class TestClass {
      @Prop({ isRequired: true, isIndexed: true, isUnique: true })
      name: string;

      @Prop({ isRequired: true, isIndexed: true })
      email: string;

      @Prop({ isNullable: true })
      age: number;

      @EnumProp({ values: Gender })
      gender: Gender;

      @Prop({ jsonSchema: friendJSONSchema, isNullable: true })
      bestFriend?: FriendClass;

      @ArrayProp({
        itemsJSONSchema: friendJSONSchema,
        arrayJSONSchema: { maxItems: 2 },
      })
      friends: FriendClass[];
    }

    const jsonSchema = createJSONSchemaForClass(TestClass);
    expect(jsonSchema).toEqual({
      bsonType: "object",
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        age: { bsonType: ["number", "null"] },
        gender: { enum: ["M", "F", 0, 1] },
        bestFriend: {
          ...friendJSONSchema,
          bsonType: ["object", "null"],
        },
        friends: {
          bsonType: "array",
          items: friendJSONSchema,
          maxItems: 2,
        },
      },
      required: ["name", "email"],
    });
  });
});

describe("Indexes", () => {
  it("Should create valid indexes", () => {
    @Schema()
    class TestClass {
      @Prop({ isIndexed: true, isUnique: true })
      name: string;

      @Prop({ isIndexed: true })
      age: number;
    }
    const indexes = createIndexesForClass(TestClass);
    expect(indexes).toEqual([
      { key: { name: 1 }, unique: true },
      { key: { age: 1 } },
    ]);
  });
});
