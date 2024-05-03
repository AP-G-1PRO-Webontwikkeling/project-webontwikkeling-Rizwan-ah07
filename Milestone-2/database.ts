import { MongoClient, Db, ObjectId } from 'mongodb';

// Database connection settings
const url: string = 'mongodb://localhost:27017';
const dbName: string = 'yourDatabaseName';
const client: MongoClient = new MongoClient(url);

// Connect to MongoDB
async function connectDb(): Promise<Db> {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB server');
    return client.db(dbName);
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

// Check and initialize data
async function checkAndInitializeData(fetchData: () => Promise<any[]>): Promise<void> {
  const db = await connectDb();
  const collection = db.collection('cards');
  const exists = await collection.countDocuments();

  if (exists === 0) {
    const data = await fetchData(); // fetchData is a placeholder for your actual fetch function
    await collection.insertMany(data);
    console.log("Data initialized in MongoDB");
  }
}

// Exporting connection and data initialization function
export { connectDb, checkAndInitializeData };