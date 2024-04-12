import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { Card } from '../Milestone-1/interfaces';
import { Character } from '../Milestone-1/interfaces';
import cardsDataJson from '../JSON/cards.json';
import charactersDataJson from '../JSON/characters.json';

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);

// card
const cardsData: Card[] = cardsDataJson as Card[];
const charactersData: Character[] = charactersDataJson as Character[];

app.get("/", (req: Request, res: Response) => {
    res.render("index", {
        title: "Home",
        message: "Welcome to the Card and Character Viewer!"
    });
});

// Sorteer
app.get("/cards", (req: Request, res: Response) => {
    let searchQuery = req.query.search as string;
    let sortField = req.query.sortField as string || 'name'; 
    let sortOrder = req.query.sortOrder as string || 'asc';  

    let filteredData = cardsData;

    filteredData.sort((a:any, b:any) => {
        if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

        // search bar
        if (searchQuery) {
            searchQuery = searchQuery.toLowerCase(); 
            filteredData = filteredData.filter(card =>
                card.name.toLowerCase().includes(searchQuery)
            );
        }


    res.render("cards", {
        cards: filteredData,
        searchQuery: searchQuery,
        sortField: sortField,
        sortOrder: sortOrder
    });
    
    filteredData.sort((a:any, b:any) => {
        let fieldA = a[sortField];
        let fieldB = b[sortField];
        // attack and defence points
        if (!isNaN(Number(fieldA)) && !isNaN(Number(fieldB))) {
          fieldA = Number(fieldA);
          fieldB = Number(fieldB);
        }
        if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
});



app.get("/cards/:id", (req: Request, res: Response) => {

    const card = cardsData.find((c: Card) => c.id.toString() === req.params.id);
    if (!card) {
        return res.status(404).send("Card not found");
    }
    res.render("cardDetail", { card });
});

//character 
app.get("/characters", (req: Request, res: Response) => {
    //sort
    let searchQuery = req.query.search as string;
    let sortField = req.query.sortField as string || 'name'; 
    let sortOrder = req.query.sortOrder as string || 'asc';  

    let filteredData = charactersData;

    filteredData.sort((a:any, b:any) => {
        if (a[sortField] < b[sortField]) return sortOrder === 'asc' ? -1 : 1;
        if (a[sortField] > b[sortField]) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

        // search
        if (searchQuery) {
            searchQuery = searchQuery.toLowerCase(); // Case-insensitive matching
            filteredData = filteredData.filter(character =>
                character.name.toLowerCase().includes(searchQuery)
            );
        }

    res.render("characters", {
        characters: filteredData,
        searchQuery: searchQuery,
        sortField: sortField,
        sortOrder: sortOrder
    });
});

app.get("/characters/:id", async (req, res) => {
    const characterId = parseInt(req.params.id);
    const character = charactersData.find(c => c.id === characterId);

    if (!character) {
        return res.status(404).send("Character not found");
    }

    const relatedCards = cardsData.filter(card => card.characterId === characterId);
    res.render("characterDetail", { character, relatedCards });
});


app.listen(app.get("port"), () => {
    console.log(`Server started on http://localhost:${app.get('port')}`);
});


