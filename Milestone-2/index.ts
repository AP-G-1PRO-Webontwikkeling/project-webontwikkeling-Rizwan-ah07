import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import fetch from 'node-fetch'; 
import { Card, Character } from '../Milestone-1/interfaces';
import { connectDb, initializeDb } from './database'; 
import { ObjectId } from 'mongodb'; 

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

// Initialize the database
initializeDb();

// Home route
app.get("/", (req: Request, res: Response) => {
    res.render("index", {
        title: "Home",
        message: "Welcome to the Card and Character Viewer!"
    });
});

// Cards route
app.get("/cards", async (req: Request, res: Response) => {
    try {
        const db = await connectDb();
        const collection = db.collection<Card>('cards');
        const searchQuery = req.query.search as string || '';
        const sortField = req.query.sortField as string || 'name';
        const sortOrder = req.query.sortOrder as string || 'asc';
        const query = searchQuery ? { name: { $regex: searchQuery, $options: 'i' } } : {};
        const sortOrderNumeric = sortOrder === 'asc' ? 1 : -1;
        const sort: Record<string, 1 | -1> = { [sortField]: sortOrderNumeric };
        const cards = await collection.find(query).sort(sort).toArray();
        res.render("cards", { cards, searchQuery, sortField, sortOrder });
    } catch (error) {
        console.error("Failed to retrieve cards:", error);
        res.status(500).send("Error retrieving card list");
    }
});

// Single card detail route
app.get("/cards/:id", async (req: Request, res: Response) => {
    try {
        const db = await connectDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send("Invalid ID format");
        }
    
        const card = await db.collection<Card>('cards').findOne({ _id: new ObjectId(id) });
        if (!card) {
            return res.status(404).send("Card not found");
        }
        res.render("cardDetail", { card });
    } catch (error) {
        console.error("Failed to retrieve card:", error);
        res.status(500).send("Error retrieving card");
    }
});

// Edit card route
app.get("/cards/:id/edit", async (req: Request, res: Response) => {
    try {
        const db = await connectDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send("Invalid ID format");
        }
        const card = await db.collection<Card>('cards').findOne({ _id: new ObjectId(id) });
        if (!card) return res.status(404).send("Card not found");
        res.render("cardEdit", { card });
    } catch (error) {
        console.error("Failed to retrieve card for editing:", error);
        res.status(500).send("Error retrieving card for editing");
    }
});

app.post("/cards/:id/edit", async (req: Request, res: Response) => {
    try {
        const db = await connectDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send("Invalid ID format");
        }
        const updateData: Partial<Card> = {
            name: req.body.name,
            description: req.body.description,
            attack_points: parseInt(req.body.attack_points),
            defence_points: parseInt(req.body.defence_points),
            type: req.body.type,
        };

        const result = await db.collection<Card>('cards').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
        if (result.modifiedCount === 0) {
            return res.status(404).send("No updates made, card not found.");
        }
        res.redirect(`/cards/${req.params.id}`);
    } catch (error) {
        console.error("Failed to update the card:", error);
        res.status(500).send("Error updating card");
    }
});

// Characters route
app.get("/characters", async (req: Request, res: Response) => {
    try {
        const db = await connectDb();
        const collection = db.collection<Character>('characters');
        const searchQuery = req.query.search as string || '';
        const sortField = req.query.sortField as string || 'name';
        const sortOrder = req.query.sortOrder as string || 'asc';
        const query = searchQuery ? { name: { $regex: searchQuery, $options: 'i' } } : {};
        const sortOrderNumeric = sortOrder === 'asc' ? 1 : -1;
        const sort: Record<string, 1 | -1> = { [sortField]: sortOrderNumeric };
        const characters = await collection.find(query).sort(sort).toArray();
        res.render("characters", { characters, searchQuery, sortField, sortOrder });
    } catch (error) {
        console.error("Failed to retrieve characters:", error);
        res.status(500).send("Error retrieving character list");
    }
});

// Single character detail route
app.get("/characters/:id", async (req, res) => {
    try {
        const db = await connectDb();
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send("Invalid ID format");
        }
        const charactersCollection = db.collection<Character>('characters');
        const cardsCollection = db.collection<Card>('cards');
        const character = await charactersCollection.findOne({ _id: new ObjectId(id) });

        if (!character) {
            return res.status(404).send("Character not found");
        }

        const relatedCards = await cardsCollection.find({ characterId: character.id }).toArray();
        res.render("characterDetail", { character, relatedCards });
    } catch (error) {
        console.error("Failed to retrieve character:", error);
        res.status(500).send("Error retrieving character");
    }
});
app.listen(app.get("port"), () => {
    console.log(`Server started on http://localhost:${app.get('port')}`);
});
