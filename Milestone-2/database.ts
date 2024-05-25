import { MongoClient, Db, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; 

dotenv.config();

const url: string = process.env.MONGODB_URI as string;
const dbName: string = 'Yu-Gi-Oh';
const client: MongoClient = new MongoClient(url);

async function connectDb(): Promise<Db> {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB Atlas');
    return client.db(dbName);
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas', error);
    throw new Error('Failed to connect to MongoDB Atlas');
  }
}

async function fetchAndStoreData(url: string, collectionName: string) {
  const db = await connectDb();
  const collection = db.collection(collectionName);
  const response = await fetch(url);
  const data = await response.json();
  await collection.insertMany(data);
  console.log(`Data from ${url} inserted into ${collectionName} collection`);
}

async function initializeDb() {
  const db = await connectDb();
  const cardCount = await db.collection('cards').countDocuments();
  const characterCount = await db.collection('characters').countDocuments();
  
  if (cardCount === 0) {
    const cardsUrl = 'https://raw.githubusercontent.com/Rizwan-ah07/Web-Ontwikkeling-Data/main/cards.json';
    const response = await fetch(cardsUrl);
    const cardsData = await response.json();
    // Convert characterId to ObjectId if it's a valid hex string
    const updatedCardsData = cardsData.map((card: any) => ({
      ...card,
      characterId: card.characterId && ObjectId.isValid(card.characterId) ? new ObjectId(card.characterId) : undefined
    }));
    await db.collection('cards').insertMany(updatedCardsData);
  }
  if (characterCount === 0) {
    const charactersUrl = 'https://raw.githubusercontent.com/Rizwan-ah07/Web-Ontwikkeling-Data/main/characters.json';
    const response = await fetch(charactersUrl);
    const charactersData = await response.json();
    await db.collection('characters').insertMany(charactersData);
  }
}

export { connectDb, initializeDb, fetchAndStoreData };
