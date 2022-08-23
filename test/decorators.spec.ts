import "reflect-metadata";
import { describe, it, expect } from "vitest";
import {
  Prop,
  NullableProp,
  RequiredProp,
  RawProp,
  Schema,
  createJSONSchemaForClass,
  createIndexesForClass,
} from "../lib";

describe("Schemas", () => {
  it("Should create a basic schema", () => {
    class TestClass {
      @RequiredProp()
      name: string;

      @NullableProp()
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

    class MyClass {
      @RequiredProp({ schema: { minLength: 2 } })
      name: string;

      @RequiredProp()
      email: string;

      @NullableProp({ schema: { minimum: 16 } })
      age: number;

      @Prop({ enum: Gender })
      gender: Gender;

      @NullableProp(FriendClass)
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

      @RawProp()
      meta: any;
    }

    const jsonSchema = createJSONSchemaForClass(MyClass);
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
        meta: {},
      },
      required: ["name", "email"],
    });
  });
  it("Should automatically create sub schemas", () => {
    class SubClass {
      @Prop()
      name: string;
    }

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

    @Schema()
    class TestClass {
      @Prop({ index: { isUnique: true } })
      id: string;

      @Prop({ type: SubClass, isClass: true })
      nameRef: SubClass;

      @Prop({ type: SubClass, isClass: true, excludeSubIndexes: true })
      nameRefWithoutIndex: SubClass;
    }

    @Schema()
    class Test2Class extends TestClass {}

    const indexes = createIndexesForClass(Test2Class);
    expect(indexes).toEqual([
      { key: { id: 1 }, unique: true },
      { key: { "nameRef.name": 1 } },
    ]);
  });
});
