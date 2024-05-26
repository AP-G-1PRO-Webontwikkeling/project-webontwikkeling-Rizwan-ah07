import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import { Card, Character } from '../Milestone-1/interfaces';
import { connect, getAllCards, getAllCharacters, findCardById, findCharacterById, login, register, updateCardById, CharacterCollection, CardCollection } from "./database";
import { ObjectId } from "mongodb";

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3000;

declare module "express-session" {
    interface SessionData {
        user: { [key: string]: any };
    }
}

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: true
}));

app.get("/", (req: Request, res: Response) => {
    res.render("index", { title: "Home", message: "Welcome to the Card and Character Viewer!" });
});

app.get("/cards", async (req: Request, res: Response) => {
    try {
        const searchQuery = (req.query.search as string) || '';
        const sortField = (req.query.sortField as string) || 'name';
        const sortOrder = (req.query.sortOrder as string) || 'asc';
        const sortOrderNumeric = sortOrder === 'asc' ? 1 : -1;
        const cards = await getAllCards();
        const filteredCards = cards.filter(card => card.name.toLowerCase().includes(searchQuery.toLowerCase()));
        const sortedCards = filteredCards.sort((a, b) => {
            const fieldA = a[sortField as keyof Card];
            const fieldB = b[sortField as keyof Card];
            if (fieldA && fieldB) {
                if (fieldA < fieldB) return sortOrderNumeric;
                if (fieldA > fieldB) return -sortOrderNumeric;
            }
            return 0;
        });
        res.render("cards", { cards: sortedCards, searchQuery, sortField, sortOrder });
    } catch (error) {
        console.error("Failed to retrieve cards:", error);
        res.status(500).send("Error retrieving card list");
    }
});

app.get("/cards/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        console.error("Invalid card ID format:", id);
        return res.status(400).send("Invalid ID format");
    }

    const card = await CardCollection.findOne({ id: id });
    if (!card) {
        return res.status(404).send("Card not found");
    }
    res.render("cardDetail", { card });
});

app.get("/cards/:id/edit", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        console.error("Invalid card ID format:", id);
        return res.status(400).send("Invalid ID format");
    }

    const card = await CardCollection.findOne({ id: id });
    if (!card) return res.status(404).send("Card not found");
    res.render("editCard", { card });
});

app.post("/cards/:id/edit", async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).send("Invalid ID format");
        }
        const updateData: Partial<Card> = {
            name: req.body.name,
            description: req.body.description,
            attack_points: parseInt(req.body.attack_points),
            defence_points: parseInt(req.body.defence_points),
            type: req.body.type
        };

        const result = await CardCollection.updateOne({ id: id }, { $set: updateData });
        if (result.modifiedCount === 0) {
            return res.status(404).send("No updates made, card not found.");
        }
        res.redirect(`/cards/${req.params.id}`);
    } catch (error) {
        console.error("Failed to update the card:", error);
        res.status(500).send("Error updating card");
    }
});

app.get("/characters", async (req: Request, res: Response) => {
    const searchQuery = (req.query.search as string) || '';
    const sortField = (req.query.sortField as string) || 'name';
    const sortOrder = (req.query.sortOrder as string) || 'asc';
    const sortOrderNumeric = sortOrder === 'asc' ? 1 : -1;

    const characters = await getAllCharacters();
    const filteredCharacters = characters.filter(character => character.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const sortedCharacters = filteredCharacters.sort((a, b) => {
        const fieldA = a[sortField as keyof Character];
        const fieldB = b[sortField as keyof Character];
        if (fieldA && fieldB) {
            if (fieldA < fieldB) return sortOrderNumeric;
            if (fieldA > fieldB) return -sortOrderNumeric;
        }
        return 0;
    });

    res.render("characters", { characters: sortedCharacters, searchQuery, sortField, sortOrder });
});

app.get("/characters/:id", async (req: Request, res: Response) => {
    const id = req.params.id;
    let character;
    let relatedCards = [];
    if (ObjectId.isValid(id)) {
        character = await findCharacterById(new ObjectId(id));
    } else {
        character = await CharacterCollection.findOne({ id: parseInt(id) });
    }

    if (character) {
        relatedCards = await CardCollection.find({ characterId: character.id }).toArray();
    } else {
        console.error("Character not found for ID:", id);
        res.redirect("/?error=characterNotFound");
        return;
    }

    res.render("characterDetail", { character, relatedCards });
});

app.post("/login", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await login(email, password);
        if (req.session) {
            req.session.user = user;
        }
        res.redirect("/");
    } catch (error) {
        if (error instanceof Error) {
            res.status(401).send(error.message);
        } else {
            res.status(401).send("Unknown error occurred");
        }
    }
});

app.post("/register", async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        await register(email, password);
        res.redirect("/login");
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).send(error.message);
        } else {
            res.status(400).send("Unknown error occurred");
        }
    }
});

app.listen(port, async () => {
    await connect();
    console.log(`[server] http://localhost:${port}`);
});
