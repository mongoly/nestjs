import "reflect-metadata";
import { describe, it, expect } from "vitest";
import {
  Prop,
  Schema,
  createJSONSchemaForClass,
  createIndexesForClass,
  Raw,
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
        age: { bsonType: ["null", "number"] },
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
    class MyClass {
      @Prop({ isRequired: true, schema: { minLength: 2 } })
      name: string;

      @Prop({ isRequired: true })
      email: string;

      @Prop({ isNullable: true, schema: { minimum: 16 } })
      age: number;

      @Prop({ enum: Gender })
      gender: Gender;

      @Raw({ ...friendJSONSchema, bsonType: ["null", "object"] })
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

      @Prop([Number])
      moreNumbers: number[];
    }

    const jsonSchema = createJSONSchemaForClass(MyClass);
    console.dir(jsonSchema, { depth: null });
    expect(jsonSchema).toEqual({
      bsonType: "object",
      properties: {
        name: { bsonType: "string", minLength: 2 },
        email: { bsonType: "string" },
        age: { bsonType: ["null", "number"], minimum: 16 },
        gender: { enum: ["M", "F", 0, 1] },
        bestFriend: {
          ...friendJSONSchema,
          bsonType: ["null", "object"],
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
        moreNumbers: {
          bsonType: "array",
          items: { bsonType: "number" },
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
  it("Should extend schemas", () => {
    @Schema()
    class A {
      @Prop()
      id: string;
    }

    @Schema()
    class B extends A {
      @Prop()
      name: string;
    }

    @Schema()
    class C extends B {
      @Prop()
      age: number;
    }

    @Schema()
    class D extends C {
      @Prop()
      address: string;
    }

    const jsonSchema = createJSONSchemaForClass(D);
    expect(jsonSchema).toEqual({
      bsonType: "object",
      properties: {
        id: { bsonType: "string" },
        name: { bsonType: "string" },
        age: { bsonType: "number" },
        address: { bsonType: "string" },
      },
    });
  });
});

describe("Indexes", () => {
  it("Should create valid indexes", () => {
    @Schema()
    class TestClass {
      @Prop({ index: { isUnique: true } })
      id: string;

      @Prop({ isIndexed: true })
      name: string;

      @Prop({ index: -1 })
      age: number;

      @Prop({ index: true })
      address: string;
    }
    const indexes = createIndexesForClass(TestClass);
    expect(indexes).toEqual([
      { key: { id: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { age: -1 } },
      { key: { address: 1 } },
    ]);
  });

  it("Should create nested indexes", () => {
    @Schema()
    class SubClass {
      @Prop({ index: true })
      name: string;

      @Prop({ index: true, excludeFromIndexes: true })
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
