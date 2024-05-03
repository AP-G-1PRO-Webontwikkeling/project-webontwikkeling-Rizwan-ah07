import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import fetch from 'node-fetch'; 
import { Card, Character } from '../Milestone-1/interfaces';
import { connectDb } from './database'; 

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

// URLs of the JSON files in GitHub
const cardsUrl = 'https://raw.githubusercontent.com/Rizwan-ah07/Web-Ontwikkeling-Data/main/cards.json';
const charactersUrl = 'https://raw.githubusercontent.com/Rizwan-ah07/Web-Ontwikkeling-Data/main/characters.json';
async function fetchJsonData(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

// Home route
app.get("/", (req: Request, res: Response) => {
    res.render("index", {
        title: "Home",
        message: "Welcome to the Card and Character Viewer!"
    });
});

// Cards route
app.get("/cards", async (req: Request, res: Response) => {
    const cardsData: Card[] = await fetchJsonData(cardsUrl) as Card[];
    let searchQuery = req.query.search as string || ''; // Default to an empty string if not provided
    let sortField = req.query.sortField as string || 'name'; 
    let sortOrder = req.query.sortOrder as string || 'asc';  

    let filteredData = searchQuery ? cardsData.filter(card => card.name.toLowerCase().includes(searchQuery.toLowerCase())) : cardsData;

    // Sorting
    filteredData.sort((a: any, b: any) => {
        if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    res.render("cards", {
        cards: filteredData,
        searchQuery,
        sortField,
        sortOrder
    });
});

// Single card detail route
app.get("/cards/:id", async (req: Request, res: Response) => {
    const cardsData: Card[] = await fetchJsonData(cardsUrl) as Card[];
    const card = cardsData.find(c => c.id.toString() === req.params.id);
    if (!card) {
        return res.status(404).send("Card not found");
    }
    res.render("cardDetail", { card });
});

// Characters route
app.get("/characters", async (req: Request, res: Response) => {
    const charactersData: Character[] = await fetchJsonData(charactersUrl) as Character[];
    let searchQuery = req.query.search as string || ''; // Default to an empty string if not provided
    let sortField = req.query.sortField as string || 'name'; 
    let sortOrder = req.query.sortOrder as string || 'asc';  

    let filteredData = searchQuery ? charactersData.filter(character => character.name.toLowerCase().includes(searchQuery.toLowerCase())) : charactersData;

    // Sorting
    filteredData.sort((a: any, b: any) => {
        if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    res.render("characters", {
        characters: filteredData,
        searchQuery,
        sortField,
        sortOrder
    });
});

// Single character detail route
app.get("/characters/:id", async (req, res) => {
    const charactersData: Character[] = await fetchJsonData(charactersUrl) as Character[];
    const character = charactersData.find(c => c.id === parseInt(req.params.id));
    if (!character) {
        return res.status(404).send("Character not found");
    }
    const cardsData: Card[] = await fetchJsonData(cardsUrl) as Card[];
    const relatedCards = cardsData.filter(card => card.characterId === character.id);
    res.render("characterDetail", { character, relatedCards });
});

app.listen(app.get("port"), () => {
    console.log(`Server started on http://localhost:${app.get('port')}`);
});
