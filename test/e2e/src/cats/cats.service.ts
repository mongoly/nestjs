import { Injectable } from "@nestjs/common";
import { Collection, WithId, ObjectId } from "mongodb";
import { InjectCollection } from "../../../../lib";
import { Cat } from "./cats.entity";

@Injectable()
export class CatsService {
  constructor(
    @InjectCollection(Cat.name) private readonly catsCollection: Collection<Cat>
  ) {}

  getCollection() {
    return this.catsCollection;
  }

  async create(cat: Cat): Promise<WithId<Cat>> {
    const { insertedId } = await this.catsCollection.insertOne(cat);
    return { _id: insertedId, ...cat };
  }

  async deleteAll() {
    await this.catsCollection.deleteMany({});
  }

  findById(id: ObjectId) {
    return this.catsCollection.findOne({ _id: id });
  }

  findFirstByName(name: string) {
    return this.catsCollection.findOne({ name });
  }

  findAllByAge(age: number) {
    return this.catsCollection.find({ age }).toArray();
  }

  findAllByBreed(breed: string) {
    return this.catsCollection.find({ breed }).toArray();
  }
}
