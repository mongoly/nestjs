import { Test } from "@nestjs/testing";
import { describe, it, expect, afterAll, afterEach, beforeAll } from "vitest";
import { CatsService } from "./src/cats";
import { AppModule } from "./src/app.module";
import { MongoClient, ObjectId } from "mongodb";
import { getConnectionToken } from "../../lib";

describe("App", () => {
  let catsService: CatsService;
  let client: MongoClient;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    catsService = moduleRef.get<CatsService>(CatsService);
    client = moduleRef.get(getConnectionToken());
  });

  afterEach(async () => {
    await catsService.deleteAll();
  });

  afterAll(async () => {
    await client.db().dropDatabase();
    await client.close();
  });

  it("Should be able to create a cat", async () => {
    const cat = await catsService.create({
      name: "Fluffy",
      age: 3,
      breed: "Siamese",
    });
    expect(cat).toEqual({
      _id: expect.any(ObjectId),
      name: "Fluffy",
      age: 3,
      breed: "Siamese",
    });
  });

  it("Should not be able to create a cat", async () => {
    await expect(
      // @ts-ignore
      catsService.create({
        name: "Fluffy",
      })
    ).rejects.toThrowError("Document failed validation");
  });

  it("Should be able to find a cat by id", async () => {
    const cat = await catsService.create({
      name: "Fluffy",
      age: 3,
      breed: "Siamese",
    });
    const foundCat = await catsService.findById(cat._id);
    expect(foundCat).toEqual(cat);
  });

  it("Should be able to find a cat by name", async () => {
    const cat = await catsService.create({
      name: "Fluffy",
      age: 3,
      breed: "Siamese",
    });
    const foundCat = await catsService.findFirstByName("Fluffy");
    expect(foundCat).toEqual(cat);
  });

  it("Should be able to find a cat by age", async () => {
    const cat = await catsService.create({
      name: "Fluffy",
      age: 3,
      breed: "Siamese",
    });
    const foundCats = await catsService.findAllByAge(3);
    expect(foundCats).toEqual([cat]);
  });

  it("Should be able to find a cat by breed", async () => {
    const cat = await catsService.create({
      name: "Fluffy",
      age: 3,
      breed: "Siamese",
    });
    const foundCats = await catsService.findAllByBreed("Siamese");
    expect(foundCats).toEqual([cat]);
  });
});
