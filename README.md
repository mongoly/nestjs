# @mongoly/core
The core of mongoly. This library includes all the primary functionality and goals of this project.

## Installation
```bash
npm install mongodb @mongoly/core
```

## Primary Usage

```ts
import { MongoClient } from 'mongodb';
import { ensureJSONSchema, ensureIndexes } from '@mongoly/core';

async function bootstrap() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('test');
  await ensureJSONSchema(db, 'users', {
    bsonType: 'object'
    properties: {
      name: { bsonType: 'string' },
      age: { bsonType: 'number'},
    },
    required: ['name', 'age']
  });
  const collection = db.collection('users');
  await ensureIndexes(collection, [
    { 
      key: { name: 1 },
      unique: true, 
    }
  ]);
  await collection.insertOne({ name: 'John', age: 27 }) 
  await collection.insertOne({ name: 'Jane', age: '27' }) // Document Validation Error 
}
```