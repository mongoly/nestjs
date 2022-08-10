import "reflect-metadata";
import { describe, it, expect } from "vitest";
import {
  Prop,
  Schema,
  createJSONSchemaForClass,
  createIndexesForClass,
} from "../lib";

describe("Schemas", () => {
  it("Should create a basic schema", () => {
    @Schema()
    class TestClass {
      @Prop({ isRequired: true })
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
      @Prop({ isRequired: true, schema: { minLength: 2 } })
      name: string;

      @Prop({ isRequired: true })
      email: string;

      @Prop({ isNullable: true, schema: { minimum: 16 } })
      age: number;

      @Prop({ enum: Gender })
      gender: Gender;

      @Prop({ isNullable: true })
      bestFriend?: FriendClass;

      @Prop({
        type: [FriendClass],
        schema: { minItems: 2, maxItems: 5 },
      })
      friends: FriendClass[];

      @Prop({
        type: [Number],
        schema: { minItems: 1, minimum: 0 },
      })
      numbers: number[];
    }

    const jsonSchema = createJSONSchemaForClass(TestClass);
    expect(jsonSchema).toEqual({
      bsonType: "object",
      properties: {
        name: { bsonType: "string", minLength: 2 },
        email: { bsonType: "string" },
        age: { bsonType: ["number", "null"], minimum: 16 },
        gender: { enum: ["M", "F", 0, 1] },
        bestFriend: {
          ...friendJSONSchema,
          bsonType: ["object", "null"],
        },
        friends: {
          bsonType: "array",
          items: friendJSONSchema,
          minItems: 2,
          maxItems: 5,
        },
        numbers: {
          bsonType: "array",
          items: { bsonType: "number", minimum: 0 },
          minItems: 1,
        },
      },
      required: ["name", "email"],
    });
  });
  it("Should automatically create sub schemas", () => {
    @Schema()
    class SubClass {
      @Prop()
      name: string;
    }

    @Schema()
    class ParentClass {
      @Prop()
      id: string;

      @Prop()
      sub: SubClass;
    }

    const jsonSchema = createJSONSchemaForClass(ParentClass);
    expect(jsonSchema).toEqual({
      bsonType: "object",
      properties: {
        id: { bsonType: "string" },
        sub: {
          bsonType: "object",
          properties: {
            name: { bsonType: "string" },
          },
        },
      },
    });
  });
  it.fails("Should not create a sub schema if not specified", () => {
    class SubClass {
      @Prop()
      name: string;
    }

    @Schema()
    class ParentClass {
      @Prop()
      id: string;

      @Prop()
      sub: SubClass;
    }

    createJSONSchemaForClass(ParentClass);
  });
});

describe("Indexes", () => {
  it("Should create valid indexes", () => {
    @Schema()
    class TestClass {
      @Prop({ index: { isUnique: true } })
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

  it("Should create nested indexes", () => {
    @Schema()
    class SubClass {
      @Prop({ isIndexed: true })
      name: string;

      @Prop({ isIndexed: true, excludeFromIndexes: true })
      age: number;
    }

    createJSONSchemaForClass(SubClass);

    @Schema()
    class TestClass {
      @Prop({ index: { isUnique: true } })
      id: string;

      @Prop({ type: SubClass, isClass: true })
      nameRef: SubClass;

      @Prop({ type: SubClass, isClass: true, excludeSubIndexes: true })
      nameRefWithoutIndex: SubClass;
    }

    const indexes = createIndexesForClass(TestClass);
    expect(indexes).toEqual([
      { key: { id: 1 }, unique: true },
      { key: { "nameRef.name": 1 } },
    ]);
  });
});
