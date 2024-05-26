// database.ts
import { Collection, MongoClient, ObjectId } from "mongodb";
import { Card, Character, User } from "./interfaces";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import fetch from 'node-fetch';
dotenv.config();

export const MONGODB_URI = process.env.MONGO_URI ?? "mongodb+srv://s151398:Web-ont@web.p0tgiw1.mongodb.net";
const client = new MongoClient(MONGODB_URI);
const saltRounds: number = 10;

export const CardCollection: Collection<Card> = client.db("Yu-Gi-Oh-Cards").collection<Card>("cards");
export const CharacterCollection: Collection<Character> = client.db("Yu-Gi-Oh-Cards").collection<Character>("characters");
export const UserCollection: Collection<User> = client.db("Yu-Gi-Oh-Cards").collection<User>("users");

const cardsUrl = 'https://raw.githubusercontent.com/Rizwan-ah07/Web-Ontwikkeling-Data/main/cards.json';
const charactersUrl = 'https://raw.githubusercontent.com/Rizwan-ah07/Web-Ontwikkeling-Data/main/characters.json';

export async function getAllCards() {
    return await CardCollection.find().toArray();
}

export async function findCardByName(name: string) {
    return await CardCollection.findOne({ name });
}

export async function findCardById(id: ObjectId) {
    return await CardCollection.findOne({ _id: id });
}

export async function getAllCharacters() {
    return await CharacterCollection.find().toArray();
}

export async function findCharacterByName(name: string) {
    return await CharacterCollection.findOne({ name });
}

export async function findCharacterById(id: ObjectId) {
    console.log("Looking up character with ID:", id);
    return await CharacterCollection.findOne({ _id: id });
}

export async function findUserByEmail(email: string) {
    return await UserCollection.findOne({ email: email });
}

export async function updateCardById(id: ObjectId, updateData: Partial<Card>) {
    return await CardCollection.updateOne({ _id: id }, { $set: updateData });
}

async function createInitialUsers() {
    if (await UserCollection.countDocuments() > 0) { return; }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const userEmail = process.env.USER_EMAIL;
    const userPassword = process.env.USER_PASSWORD;

    if (!adminEmail || !adminPassword || !userEmail || !userPassword) {
        throw new Error("Admin and User email or password must be set in the environment");
    }

    const adminHash = await bcrypt.hash(adminPassword, saltRounds);
    const userHash = await bcrypt.hash(userPassword, saltRounds);

    await UserCollection.insertMany([
        { email: adminEmail, password: adminHash, role: "ADMIN" },
        { email: userEmail, password: userHash, role: "USER" }
    ]);
}

export async function login(email: string, password: string) {
    if (email === "" || password === "") {
        throw new Error("Email and password required");
    }
    let user: User | null = await findUserByEmail(email);
    if (user) {
        if (user.password && await bcrypt.compare(password, user.password)) {
            return user;
        } else {
            throw new Error("Password incorrect");
        }
    } else {
        throw new Error("User not found");
    }
}

export async function loadDataToTheDatabase() {
    const cards: Card[] = await getAllCards();
    const characters: Character[] = await getAllCharacters();
    if (cards.length === 0) {
        console.log('Cards collection is empty, loading data into the database');
        const response = await fetchData<Card[]>(cardsUrl);
        await CardCollection.insertMany(response);
    }

    if (characters.length === 0) {
        console.log('Characters collection is empty, loading data into the database');
        const response = await fetchData<Character[]>(charactersUrl);
        await CharacterCollection.insertMany(response);
    }

    return;
}

async function fetchData<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return await response.json() as T;
}

export async function register(email: string, password: string) {
    if (email === "" || password === "") {
        throw new Error("Email and password required");
    }
    
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error("User already exists");
    }
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const newUser: User = {
        email: email,
        password: hashedPassword,
        role: "USER"
    };
    
    const result = await UserCollection.insertOne(newUser);
    return result.insertedId;
}

async function exit() {
    try {
        await client.close();
        console.log('Disconnected from database');
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

export async function connect() {
    try {
        await client.connect();
        await createInitialUsers();
        await loadDataToTheDatabase();
        console.log("Connected to the database");
        process.on('SIGINT', exit);
    } catch (error) {
        console.log('Error connecting to the database: ' + error);
    }
}
